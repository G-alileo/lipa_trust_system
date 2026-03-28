from sqlalchemy.orm import Session

from core.db import SessionLocal
from domain.enums import TransactionStatus, CampaignStatus
from modules.refunds.models import Refund
from modules.refunds.service import RefundService
from modules.campaigns.models import Campaign
from modules.system.models import FailedTransaction


class RefundWorker:

    MAX_RETRIES = 3

    def __init__(self):
        self.refund_service = RefundService()

    def process_refund_queue(self, batch_size: int = 50) -> int:
        db = SessionLocal()
        processed = 0

        try:
            pending_refunds = (
                db.query(Refund)
                .filter(
                    Refund.status == TransactionStatus.PENDING,
                    Refund.attempts < self.MAX_RETRIES
                )
                .limit(batch_size)
                .all()
            )

            for refund in pending_refunds:
                try:
                    self.refund_service.process_pending_refund(db, refund.id)
                    processed += 1
                except Exception as e:
                    self._record_failure(
                        db,
                        reference_type="REFUND_PROCESS",
                        reference_id=str(refund.id),
                        reason=str(e)
                    )
                    db.commit()

        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

        return processed

    def check_and_finalize_campaigns(self) -> int:
        db = SessionLocal()
        finalized = 0

        try:
            campaigns = (
                db.query(Campaign)
                .filter(Campaign.status == CampaignStatus.REFUND_PENDING)
                .all()
            )

            for campaign in campaigns:
                try:
                    if self.refund_service.check_campaign_refunds_complete(db, campaign.id):
                        self.refund_service.finalize_campaign_refunds(db, campaign.id)
                        finalized += 1
                except Exception as e:
                    self._record_failure(
                        db,
                        reference_type="REFUND_FINALIZE",
                        reference_id=str(campaign.id),
                        reason=str(e)
                    )
                    db.commit()

        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

        return finalized

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


def run_refund_worker():
    worker = RefundWorker()
    processed = worker.process_refund_queue()
    finalized = worker.check_and_finalize_campaigns()
    return {"processed": processed, "finalized": finalized}
