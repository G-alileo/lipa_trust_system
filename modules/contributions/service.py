from decimal import Decimal
from typing import Any, Optional

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from domain.enums import ContributionStatus
from modules.contributions.models import Contribution
from modules.system.models import FailedTransaction
from modules.campaigns.service import CampaignService, CampaignError
from modules.ledger.service import LedgerService
from modules.payments.mpesa_client import PaymentService, STKPushResponse


class ContributionError(Exception):
    pass


class ContributionNotFoundError(ContributionError):
    pass


class DuplicateReceiptError(ContributionError):
    pass


class ContributionService:

    ACCOUNT_CASH = "CASH"
    ACCOUNT_CAMPAIGN_FUNDS = "CAMPAIGN_FUNDS"

    def __init__(self):
        self.campaign_service = CampaignService()
        self.ledger_service = LedgerService()
        self.payment_service = PaymentService()

    def initiate_contribution(
        self,
        db: Session,
        user_id: int,
        campaign_id: int,
        amount: Decimal,
        phone_number: str
    ) -> Contribution:
        campaign = self.campaign_service.get_campaign_for_update(db, campaign_id)
        self.campaign_service.validate_campaign_active(campaign)

        if not self.campaign_service.can_accept_contribution(campaign, amount):
            raise ContributionError("Campaign cannot accept contributions")

        stk_response: STKPushResponse = self.payment_service.initiate_stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=campaign.account_reference,
            transaction_desc=f"Contribution to {campaign.title}",
            paybill_number=campaign.paybill_number
        )

        contribution = Contribution(
            campaign_id=campaign_id,
            user_id=user_id,
            amount=amount,
            checkout_request_id=stk_response.checkout_request_id,
            status=ContributionStatus.PENDING
        )

        db.add(contribution)
        db.commit()

        return contribution

    def handle_payment_callback(
        self,
        db: Session,
        payload: dict[str, Any]
    ) -> Optional[Contribution]:
        self.payment_service.verify_callback_payload(payload)
        callback_data = self.payment_service.extract_callback_data(payload)

        checkout_request_id = callback_data["checkout_request_id"]
        mpesa_receipt = callback_data.get("mpesa_receipt")
        success = callback_data["success"]

        if mpesa_receipt:
            existing = (
                db.query(Contribution)
                .filter(Contribution.mpesa_receipt == mpesa_receipt)
                .first()
            )
            if existing:
                return existing

        contribution = (
            db.query(Contribution)
            .filter(Contribution.checkout_request_id == checkout_request_id)
            .with_for_update()
            .first()
        )

        if not contribution:
            self._record_failure(
                db,
                reference_type="CALLBACK",
                reference_id=checkout_request_id,
                reason="Contribution not found for checkout_request_id",
                payload=payload
            )
            db.commit()
            return None

        if contribution.status != ContributionStatus.PENDING:
            return contribution

        try:
            if not success:
                contribution.status = ContributionStatus.FAILED
                self._record_failure(
                    db,
                    reference_type="CONTRIBUTION",
                    reference_id=str(contribution.id),
                    reason=callback_data.get("result_desc", "Payment failed"),
                    payload=payload
                )
                db.commit()
                return contribution

            campaign = self.campaign_service.get_campaign_for_update(
                db, contribution.campaign_id
            )

            contribution.status = ContributionStatus.COMPLETED
            contribution.mpesa_receipt = mpesa_receipt

            amount = callback_data.get("amount") or contribution.amount

            self.ledger_service.create_entry(
                db=db,
                campaign_id=campaign.id,
                reference_id=f"CONTRIB_{contribution.id}",
                debit_account=self.ACCOUNT_CASH,
                credit_account=self.ACCOUNT_CAMPAIGN_FUNDS,
                amount=amount
            )

            self.campaign_service.increment_amount(db, campaign, amount)
            self.campaign_service.mark_completed_if_goal_reached(db, campaign)

            db.commit()
            return contribution

        except IntegrityError as e:
            db.rollback()
            if "mpesa_receipt" in str(e):
                raise DuplicateReceiptError(f"Receipt {mpesa_receipt} already processed")
            self._record_failure(
                db,
                reference_type="CONTRIBUTION",
                reference_id=str(contribution.id),
                reason=str(e),
                payload=payload
            )
            db.commit()
            raise
        except CampaignError as e:
            db.rollback()
            self._record_failure(
                db,
                reference_type="CONTRIBUTION",
                reference_id=str(contribution.id),
                reason=str(e),
                payload=payload
            )
            db.commit()
            raise
        except Exception as e:
            db.rollback()
            self._record_failure(
                db,
                reference_type="CONTRIBUTION",
                reference_id=str(contribution.id),
                reason=str(e),
                payload=payload
            )
            db.commit()
            raise

    def get_contribution(self, db: Session, contribution_id: int) -> Contribution:
        contribution = (
            db.query(Contribution)
            .filter(Contribution.id == contribution_id)
            .first()
        )
        if not contribution:
            raise ContributionNotFoundError(f"Contribution {contribution_id} not found")
        return contribution

    def get_contribution_by_checkout_id(
        self,
        db: Session,
        checkout_request_id: str
    ) -> Optional[Contribution]:
        return (
            db.query(Contribution)
            .filter(Contribution.checkout_request_id == checkout_request_id)
            .first()
        )

    def reconcile_failed_payment(
        self,
        db: Session,
        contribution_id: int
    ) -> None:
        contribution = (
            db.query(Contribution)
            .filter(Contribution.id == contribution_id)
            .with_for_update()
            .first()
        )

        if not contribution:
            raise ContributionNotFoundError(f"Contribution {contribution_id} not found")

        if contribution.status != ContributionStatus.FAILED:
            return

        failed_records = (
            db.query(FailedTransaction)
            .filter(
                FailedTransaction.reference_type == "CONTRIBUTION",
                FailedTransaction.reference_id == str(contribution_id)
            )
            .all()
        )

        db.commit()

    @staticmethod
    def _record_failure(
        db: Session,
        reference_type: str,
        reference_id: str,
        reason: str,
        payload: Optional[dict] = None
    ) -> FailedTransaction:
        failed = FailedTransaction(
            reference_type=reference_type,
            reference_id=reference_id,
            reason=reason[:500] if reason else None,
            payload=payload
        )
        db.add(failed)
        db.flush()
        return failed
