from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from domain.enums import CampaignStatus, ContributionStatus, TransactionStatus
from modules.campaigns.models import Campaign
from modules.contributions.models import Contribution
from modules.refunds.models import Refund
from modules.system.models import FailedTransaction


class SurplusError(Exception):
    pass


class SurplusService:

    def handle_surplus(self, db: Session, campaign_id: int) -> Optional[Decimal]:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            raise SurplusError(f"Campaign {campaign_id} not found")

        if campaign.status != CampaignStatus.COMPLETED:
            return None

        current = campaign.current_amount or Decimal("0")
        target = campaign.target_amount

        if current <= target:
            return None

        surplus = current - target

        self._create_notification(
            db,
            notification_type="SURPLUS_DETECTED",
            reference_id=str(campaign_id),
            message=f"Campaign {campaign_id} has surplus of {surplus}",
            payload={"campaign_id": campaign_id, "surplus_amount": str(surplus)}
        )

        db.commit()
        return surplus

    def admin_approve_surplus_refund(
        self,
        db: Session,
        campaign_id: int,
        amount_to_refund: Decimal
    ) -> list[Refund]:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            raise SurplusError(f"Campaign {campaign_id} not found")

        current = campaign.current_amount or Decimal("0")
        target = campaign.target_amount
        surplus = current - target

        if surplus <= 0:
            raise SurplusError("No surplus to refund")

        if amount_to_refund > surplus:
            raise SurplusError(f"Amount {amount_to_refund} exceeds surplus {surplus}")

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

        refunds = []
        for contribution in contributions:
            pro_rata_share = (contribution.amount / total_collected) * amount_to_refund

            refund = Refund(
                contribution_id=contribution.id,
                amount=pro_rata_share.quantize(Decimal("0.01")),
                status=TransactionStatus.PENDING,
                attempts=0
            )
            db.add(refund)
            refunds.append(refund)

        db.commit()
        return refunds

    def get_surplus_amount(self, db: Session, campaign_id: int) -> Decimal:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()

        if not campaign:
            raise SurplusError(f"Campaign {campaign_id} not found")

        current = campaign.current_amount or Decimal("0")
        target = campaign.target_amount

        if current > target:
            return current - target

        return Decimal("0")

    @staticmethod
    def _create_notification(
        db: Session,
        notification_type: str,
        reference_id: str,
        message: str,
        payload: dict = None
    ) -> FailedTransaction:
        notification = FailedTransaction(
            reference_type=notification_type,
            reference_id=reference_id,
            reason=message[:500],
            payload=payload
        )
        db.add(notification)
        db.flush()
        return notification
