from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from domain.enums import CampaignStatus, ContributionStatus, TransactionStatus
from modules.campaigns.models import Campaign
from modules.contributions.models import Contribution
from modules.refunds.models import Refund
from modules.users.models import User
from modules.system.models import FailedTransaction
from modules.ledger.service import LedgerService
from modules.payments.mpesa_client import PaymentService, B2CError


class RefundError(Exception):
    pass


class RefundNotFoundError(RefundError):
    pass


class RefundService:

    MAX_RETRIES = 3
    ACCOUNT_CAMPAIGN_POOL = "CAMPAIGN_POOL"
    ACCOUNT_USER_WALLET = "USER_WALLET"

    def __init__(self):
        self.ledger_service = LedgerService()
        self.payment_service = PaymentService()

    def queue_refunds(self, db: Session, campaign_id: int) -> list[Refund]:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            raise RefundError(f"Campaign {campaign_id} not found")

        if campaign.status not in (CampaignStatus.FAILED, CampaignStatus.REFUND_PENDING):
            raise RefundError(f"Campaign {campaign_id} not eligible for refunds")

        contributions = (
            db.query(Contribution)
            .filter(
                Contribution.campaign_id == campaign_id,
                Contribution.status == ContributionStatus.COMPLETED
            )
            .all()
        )

        if not contributions:
            return []

        total_collected = sum(c.amount for c in contributions)
        current_amount = campaign.current_amount or Decimal("0")

        refunds = []
        for contribution in contributions:
            existing_refund = (
                db.query(Refund)
                .filter(Refund.contribution_id == contribution.id)
                .first()
            )
            if existing_refund:
                continue

            if total_collected > 0:
                pro_rata_share = (contribution.amount / total_collected) * current_amount
            else:
                pro_rata_share = Decimal("0")

            refund = Refund(
                contribution_id=contribution.id,
                amount=pro_rata_share.quantize(Decimal("0.01")),
                status=TransactionStatus.PENDING,
                attempts=0
            )
            db.add(refund)
            refunds.append(refund)

        if campaign.status != CampaignStatus.REFUND_PENDING:
            campaign.status = CampaignStatus.REFUND_PENDING

        db.commit()
        return refunds

    def process_pending_refund(self, db: Session, refund_id: int) -> Optional[Refund]:
        refund = (
            db.query(Refund)
            .filter(Refund.id == refund_id)
            .with_for_update()
            .first()
        )

        if not refund:
            raise RefundNotFoundError(f"Refund {refund_id} not found")

        if refund.status != TransactionStatus.PENDING:
            return refund

        if refund.attempts >= self.MAX_RETRIES:
            refund.status = TransactionStatus.FAILED
            self._record_failure(
                db,
                reference_type="REFUND",
                reference_id=str(refund.id),
                reason="Max retries exceeded"
            )
            db.commit()
            return refund

        contribution = (
            db.query(Contribution)
            .filter(Contribution.id == refund.contribution_id)
            .first()
        )

        user = (
            db.query(User)
            .filter(User.id == contribution.user_id)
            .first()
        )

        try:
            refund.attempts += 1
            response = self.payment_service.initiate_b2c_refund(
                phone_number=user.phone_number,
                amount=refund.amount,
                remarks=f"Refund for contribution {contribution.id}"
            )

            if response.success:
                refund.status = TransactionStatus.COMPLETED
                refund.raw_payload = {
                    "conversation_id": response.conversation_id,
                    "response_code": response.response_code
                }

                self.ledger_service.create_entry(
                    db=db,
                    campaign_id=contribution.campaign_id,
                    reference_id=f"REFUND_{refund.id}",
                    debit_account=self.ACCOUNT_CAMPAIGN_POOL,
                    credit_account=self.ACCOUNT_USER_WALLET,
                    amount=refund.amount
                )

                contribution.status = ContributionStatus.REFUNDED

            db.commit()
            return refund

        except B2CError as e:
            db.rollback()
            self._record_failure(
                db,
                reference_type="REFUND",
                reference_id=str(refund.id),
                reason=str(e)
            )
            db.commit()
            return refund

        except Exception as e:
            db.rollback()
            self._record_failure(
                db,
                reference_type="REFUND",
                reference_id=str(refund.id),
                reason=str(e)
            )
            db.commit()
            raise

    def get_pending_refunds(
        self,
        db: Session,
        limit: int = 100
    ) -> list[Refund]:
        return (
            db.query(Refund)
            .filter(
                Refund.status == TransactionStatus.PENDING,
                Refund.attempts < self.MAX_RETRIES
            )
            .limit(limit)
            .all()
        )

    def get_refund(self, db: Session, refund_id: int) -> Refund:
        refund = db.query(Refund).filter(Refund.id == refund_id).first()
        if not refund:
            raise RefundNotFoundError(f"Refund {refund_id} not found")
        return refund

    def check_campaign_refunds_complete(self, db: Session, campaign_id: int) -> bool:
        pending_count = (
            db.query(Refund)
            .join(Contribution, Refund.contribution_id == Contribution.id)
            .filter(
                Contribution.campaign_id == campaign_id,
                Refund.status == TransactionStatus.PENDING
            )
            .count()
        )
        return pending_count == 0

    def finalize_campaign_refunds(self, db: Session, campaign_id: int) -> None:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            return

        if self.check_campaign_refunds_complete(db, campaign_id):
            campaign.status = CampaignStatus.REFUNDED
            db.commit()

    @staticmethod
    def _record_failure(
        db: Session,
        reference_type: str,
        reference_id: str,
        reason: str
    ) -> FailedTransaction:
        failed = FailedTransaction(
            reference_type=reference_type,
            reference_id=reference_id,
            reason=reason[:500] if reason else None
        )
        db.add(failed)
        db.flush()
        return failed
