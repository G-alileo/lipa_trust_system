from datetime import datetime
from typing import Callable

from sqlalchemy.orm import Session

from core.db import SessionLocal
from domain.enums import CampaignStatus
from modules.campaigns.models import Campaign
from modules.refunds.service import RefundService
from modules.system.models import FailedTransaction


class CampaignWorker:

    def __init__(self):
        self.refund_service = RefundService()

    def check_expired_campaigns(self) -> int:
        db = SessionLocal()
        processed = 0

        try:
            expired_campaigns = (
                db.query(Campaign)
                .filter(
                    Campaign.status == CampaignStatus.ACTIVE,
                    Campaign.deadline < datetime.utcnow()
                )
                .all()
            )

            for campaign in expired_campaigns:
                try:
                    self._process_expired_campaign(db, campaign.id)
                    processed += 1
                except Exception as e:
                    self._record_failure(
                        db,
                        reference_type="CAMPAIGN_EXPIRY",
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

    def _process_expired_campaign(self, db: Session, campaign_id: int) -> None:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            return

        if campaign.status != CampaignStatus.ACTIVE:
            return

        if campaign.deadline and campaign.deadline >= datetime.utcnow():
            return

        campaign.status = CampaignStatus.FAILED
        db.commit()

        self.trigger_refunds_for_campaign(db, campaign_id)

    def trigger_refunds_for_campaign(self, db: Session, campaign_id: int) -> None:
        try:
            self.refund_service.queue_refunds(db, campaign_id)
        except Exception as e:
            self._record_failure(
                db,
                reference_type="REFUND_QUEUE",
                reference_id=str(campaign_id),
                reason=str(e)
            )
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


def run_campaign_worker():
    worker = CampaignWorker()
    return worker.check_expired_campaigns()
