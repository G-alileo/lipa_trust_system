from decimal import Decimal
from typing import Optional
from sqlalchemy import func
from sqlalchemy.orm import Session

from domain.enums import CampaignStatus, TransactionStatus, ContributionStatus
from modules.campaigns.models import Campaign
from modules.contributions.models import Contribution
from modules.refunds.models import Refund
from modules.disbursements.models import Disbursement
from modules.system.models import FailedTransaction


class MonitoringService:

    def get_failed_transactions(
        self,
        db: Session,
        limit: int = 50,
        offset: int = 0,
        reference_type: Optional[str] = None
    ) -> list[FailedTransaction]:
        query = db.query(FailedTransaction)

        if reference_type:
            query = query.filter(FailedTransaction.reference_type == reference_type)

        return (
            query
            .order_by(FailedTransaction.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_failed_transactions_count(
        self,
        db: Session,
        reference_type: Optional[str] = None
    ) -> int:
        query = db.query(FailedTransaction)

        if reference_type:
            query = query.filter(FailedTransaction.reference_type == reference_type)

        return query.count()

    def get_system_stats(self, db: Session) -> dict:
        active_campaigns = (
            db.query(Campaign)
            .filter(Campaign.status == CampaignStatus.ACTIVE)
            .count()
        )

        pending_campaigns = (
            db.query(Campaign)
            .filter(Campaign.status == CampaignStatus.DRAFT)
            .count()
        )

        completed_campaigns = (
            db.query(Campaign)
            .filter(Campaign.status == CampaignStatus.COMPLETED)
            .count()
        )

        failed_campaigns = (
            db.query(Campaign)
            .filter(Campaign.status == CampaignStatus.FAILED)
            .count()
        )

        pending_refunds = (
            db.query(Refund)
            .filter(Refund.status == TransactionStatus.PENDING)
            .count()
        )

        completed_refunds = (
            db.query(Refund)
            .filter(Refund.status == TransactionStatus.COMPLETED)
            .count()
        )

        failed_refunds = (
            db.query(Refund)
            .filter(Refund.status == TransactionStatus.FAILED)
            .count()
        )

        failed_by_type = (
            db.query(
                FailedTransaction.reference_type,
                func.count(FailedTransaction.id).label("count")
            )
            .group_by(FailedTransaction.reference_type)
            .all()
        )

        total_collected = (
            db.query(func.coalesce(func.sum(Contribution.amount), 0))
            .filter(Contribution.status == ContributionStatus.COMPLETED)
            .scalar()
        ) or Decimal("0")

        total_contributions = (
            db.query(Contribution)
            .filter(Contribution.status == ContributionStatus.COMPLETED)
            .count()
        )

        pending_contributions = (
            db.query(Contribution)
            .filter(Contribution.status == ContributionStatus.PENDING)
            .count()
        )

        pending_disbursements = (
            db.query(Disbursement)
            .filter(Disbursement.status.in_([
                TransactionStatus.PENDING,
                TransactionStatus.PROCESSING
            ]))
            .count()
        )

        return {
            "campaigns": {
                "active": active_campaigns,
                "pending": pending_campaigns,
                "completed": completed_campaigns,
                "failed": failed_campaigns
            },
            "refunds": {
                "pending": pending_refunds,
                "completed": completed_refunds,
                "failed": failed_refunds
            },
            "contributions": {
                "total": total_contributions,
                "pending": pending_contributions,
                "total_collected": str(total_collected)
            },
            "disbursements": {
                "pending": pending_disbursements
            },
            "failures": {
                "by_type": {item[0]: item[1] for item in failed_by_type},
                "total": sum(item[1] for item in failed_by_type)
            }
        }

    def get_recent_admin_actions(
        self,
        db: Session,
        limit: int = 20
    ) -> list[FailedTransaction]:
        return (
            db.query(FailedTransaction)
            .filter(FailedTransaction.reference_type == "ADMIN_ACTION")
            .order_by(FailedTransaction.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_failure_types(self, db: Session) -> list[str]:
        types = (
            db.query(FailedTransaction.reference_type)
            .distinct()
            .all()
        )
        return [t[0] for t in types]
