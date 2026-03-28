from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from domain.enums import CampaignStatus
from modules.campaigns.models import Campaign


class CampaignError(Exception):
    pass


class CampaignNotFoundError(CampaignError):
    pass


class CampaignNotActiveError(CampaignError):
    pass


class CampaignDeadlinePassedError(CampaignError):
    pass


class CampaignService:

    @staticmethod
    def get_campaign_for_update(db: Session, campaign_id: int) -> Campaign:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")
        return campaign

    @staticmethod
    def get_campaign(db: Session, campaign_id: int) -> Campaign:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")
        return campaign

    @staticmethod
    def validate_campaign_active(campaign: Campaign) -> None:
        if campaign.status != CampaignStatus.ACTIVE:
            raise CampaignNotActiveError(
                f"Campaign {campaign.id} is not active. Current status: {campaign.status}"
            )
        if campaign.deadline and campaign.deadline < datetime.utcnow():
            raise CampaignDeadlinePassedError(
                f"Campaign {campaign.id} deadline has passed"
            )

    @staticmethod
    def can_accept_contribution(campaign: Campaign, amount: Decimal) -> bool:
        if campaign.status != CampaignStatus.ACTIVE:
            return False
        if campaign.deadline and campaign.deadline < datetime.utcnow():
            return False
        return True

    @staticmethod
    def increment_amount(db: Session, campaign: Campaign, amount: Decimal) -> None:
        campaign.current_amount = (campaign.current_amount or Decimal("0")) + amount
        db.flush()

    @staticmethod
    def mark_completed_if_goal_reached(db: Session, campaign: Campaign) -> bool:
        current = campaign.current_amount or Decimal("0")
        target = campaign.target_amount

        if current >= target:
            campaign.status = CampaignStatus.COMPLETED
            db.flush()
            return True
        return False
