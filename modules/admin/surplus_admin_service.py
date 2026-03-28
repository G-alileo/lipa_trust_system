from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from domain.enums import CampaignStatus
from modules.campaigns.models import Campaign
from modules.campaigns.surplus_service import SurplusService
from modules.system.models import FailedTransaction


class SurplusAdminError(Exception):
    pass


class CampaignNotFoundError(SurplusAdminError):
    pass


class NoSurplusError(SurplusAdminError):
    pass


class SurplusAdminService:

    def __init__(self):
        self.surplus_service = SurplusService()

    def get_surplus_campaigns(
        self,
        db: Session,
        limit: int = 20,
        offset: int = 0
    ) -> list[dict]:
        campaigns = (
            db.query(Campaign)
            .filter(Campaign.status == CampaignStatus.COMPLETED)
            .all()
        )

        surplus_campaigns = []
        for campaign in campaigns:
            current = campaign.current_amount or Decimal("0")
            target = campaign.target_amount

            if current > target:
                surplus = current - target
                surplus_campaigns.append({
                    "campaign": campaign,
                    "surplus_amount": surplus,
                    "target_amount": target,
                    "current_amount": current
                })

        sorted_campaigns = sorted(
            surplus_campaigns,
            key=lambda x: x["surplus_amount"],
            reverse=True
        )

        return sorted_campaigns[offset:offset + limit]

    def get_surplus_count(self, db: Session) -> int:
        campaigns = (
            db.query(Campaign)
            .filter(Campaign.status == CampaignStatus.COMPLETED)
            .all()
        )

        count = 0
        for campaign in campaigns:
            current = campaign.current_amount or Decimal("0")
            if current > campaign.target_amount:
                count += 1

        return count

    def approve_surplus_refund(
        self,
        db: Session,
        campaign_id: int,
        admin_id: int,
        amount_to_refund: Decimal
    ) -> list:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        if campaign.status != CampaignStatus.COMPLETED:
            raise SurplusAdminError(
                f"Campaign must be COMPLETED. Current: {campaign.status}"
            )

        current = campaign.current_amount or Decimal("0")
        surplus = current - campaign.target_amount

        if surplus <= 0:
            raise NoSurplusError(f"Campaign {campaign_id} has no surplus")

        if amount_to_refund > surplus:
            raise SurplusAdminError(
                f"Amount {amount_to_refund} exceeds surplus {surplus}"
            )

        refunds = self.surplus_service.admin_approve_surplus_refund(
            db, campaign_id, amount_to_refund
        )

        self._create_audit_log(
            db,
            action="SURPLUS_REFUND_APPROVED",
            reference_id=str(campaign_id),
            admin_id=admin_id,
            details={
                "campaign_id": campaign_id,
                "amount_to_refund": str(amount_to_refund),
                "total_surplus": str(surplus),
                "refunds_created": len(refunds)
            }
        )

        db.commit()
        return refunds

    def hold_surplus(
        self,
        db: Session,
        campaign_id: int,
        admin_id: int
    ) -> Campaign:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        current = campaign.current_amount or Decimal("0")
        surplus = current - campaign.target_amount

        if surplus <= 0:
            raise NoSurplusError(f"Campaign {campaign_id} has no surplus")

        self._create_audit_log(
            db,
            action="SURPLUS_HELD",
            reference_id=str(campaign_id),
            admin_id=admin_id,
            details={
                "campaign_id": campaign_id,
                "surplus_amount": str(surplus),
                "decision": "HELD_BY_ADMIN"
            }
        )

        db.commit()
        return campaign

    @staticmethod
    def _create_audit_log(
        db: Session,
        action: str,
        reference_id: str,
        admin_id: int,
        details: dict
    ) -> FailedTransaction:
        details["admin_id"] = admin_id
        audit = FailedTransaction(
            reference_type="ADMIN_ACTION",
            reference_id=reference_id,
            reason=action,
            payload=details
        )
        db.add(audit)
        db.flush()
        return audit
