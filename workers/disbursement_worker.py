from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from core.db import SessionLocal
from domain.enums import CampaignStatus, TransactionStatus
from modules.campaigns.models import Campaign
from modules.disbursements.models import Disbursement
from modules.users.models import User
from modules.ledger.service import LedgerService
from modules.payments.mpesa_client import PaymentService, B2CError
from modules.system.models import FailedTransaction


class DisbursementWorker:

    ACCOUNT_CAMPAIGN_FUNDS = "CAMPAIGN_FUNDS"
    ACCOUNT_OWNER_WALLET = "OWNER_WALLET"

    def __init__(self):
        self.ledger_service = LedgerService()
        self.payment_service = PaymentService()

    def process_completed_campaigns(self) -> int:
        db = SessionLocal()
        processed = 0

        try:
            completed_campaigns = (
                db.query(Campaign)
                .filter(Campaign.status == CampaignStatus.COMPLETED)
                .all()
            )

            for campaign in completed_campaigns:
                existing = (
                    db.query(Disbursement)
                    .filter(Disbursement.campaign_id == campaign.id)
                    .first()
                )
                if existing:
                    continue

                try:
                    self._create_disbursement(db, campaign)
                    processed += 1
                except Exception as e:
                    self._record_failure(
                        db,
                        reference_type="DISBURSEMENT_CREATE",
                        reference_id=str(campaign.id),
                        reason=str(e)
                    )
                    db.commit()

        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

        return processed

    def _create_disbursement(self, db: Session, campaign: Campaign) -> Disbursement:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign.id)
            .with_for_update()
            .first()
        )

        owner = db.query(User).filter(User.id == campaign.owner_id).first()

        disbursement = Disbursement(
            campaign_id=campaign.id,
            amount=campaign.current_amount,
            status=TransactionStatus.PROCESSING
        )
        db.add(disbursement)
        db.flush()

        try:
            response = self.payment_service.initiate_b2c_refund(
                phone_number=owner.phone_number,
                amount=campaign.current_amount,
                remarks=f"Disbursement for campaign {campaign.id}"
            )

            disbursement.conversation_id = response.conversation_id
            disbursement.raw_payload = {
                "response_code": response.response_code,
                "response_description": response.response_description
            }

            if response.success:
                disbursement.status = TransactionStatus.COMPLETED

                self.ledger_service.create_entry(
                    db=db,
                    campaign_id=campaign.id,
                    reference_id=f"DISBURSEMENT_{disbursement.id}",
                    debit_account=self.ACCOUNT_CAMPAIGN_FUNDS,
                    credit_account=self.ACCOUNT_OWNER_WALLET,
                    amount=campaign.current_amount
                )

            db.commit()
            return disbursement

        except B2CError as e:
            disbursement.status = TransactionStatus.FAILED
            self._record_failure(
                db,
                reference_type="DISBURSEMENT_B2C",
                reference_id=str(disbursement.id),
                reason=str(e)
            )
            db.commit()
            raise

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


def run_disbursement_worker():
    worker = DisbursementWorker()
    return worker.process_completed_campaigns()
