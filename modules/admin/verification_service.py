from typing import Optional
from sqlalchemy.orm import Session

from domain.enums import CampaignStatus
from modules.campaigns.models import Campaign
from modules.contributions.models import Contribution
from modules.system.models import FailedTransaction
from modules.refunds.service import RefundService


class VerificationError(Exception):
    pass


class CampaignNotFoundError(VerificationError):
    pass


class InvalidCampaignStatusError(VerificationError):
    pass


class VerificationService:

    def __init__(self):
        self.refund_service = RefundService()

    def verify_campaign_paybill(
        self,
        db: Session,
        campaign_id: int,
        admin_id: int,
        notes: Optional[str] = None
    ) -> Campaign:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        if campaign.status != CampaignStatus.DRAFT:
            raise InvalidCampaignStatusError(
                f"Campaign must be in DRAFT status. Current: {campaign.status}"
            )

        if not campaign.paybill_number:
            raise VerificationError("Campaign has no paybill number")

        verification_result = self._verify_paybill_with_directory_api(
            campaign.paybill_number
        )

        if verification_result["verified"]:
            campaign.is_verified = True
            campaign.status = CampaignStatus.ACTIVE

            self._create_audit_log(
                db,
                action="CAMPAIGN_VERIFIED",
                reference_id=str(campaign_id),
                admin_id=admin_id,
                details={
                    "campaign_id": campaign_id,
                    "paybill_number": campaign.paybill_number,
                    "notes": notes,
                    "verification_response": verification_result
                }
            )
        else:
            campaign.status = CampaignStatus.FAILED

            self._create_audit_log(
                db,
                action="CAMPAIGN_VERIFICATION_FAILED",
                reference_id=str(campaign_id),
                admin_id=admin_id,
                details={
                    "campaign_id": campaign_id,
                    "paybill_number": campaign.paybill_number,
                    "failure_reason": verification_result.get("reason")
                }
            )

        db.commit()
        return campaign

    def reject_campaign(
        self,
        db: Session,
        campaign_id: int,
        admin_id: int,
        reason: str
    ) -> Campaign:
        campaign = (
            db.query(Campaign)
            .filter(Campaign.id == campaign_id)
            .with_for_update()
            .first()
        )

        if not campaign:
            raise CampaignNotFoundError(f"Campaign {campaign_id} not found")

        if campaign.status != CampaignStatus.DRAFT:
            raise InvalidCampaignStatusError(
                f"Campaign must be in DRAFT status. Current: {campaign.status}"
            )

        campaign.status = CampaignStatus.FAILED

        self._create_audit_log(
            db,
            action="CAMPAIGN_REJECTED",
            reference_id=str(campaign_id),
            admin_id=admin_id,
            details={
                "campaign_id": campaign_id,
                "reason": reason
            }
        )

        contributions_exist = (
            db.query(Contribution)
            .filter(Contribution.campaign_id == campaign_id)
            .first()
        )

        if contributions_exist:
            self.refund_service.queue_refunds(db, campaign_id)

        db.commit()
        return campaign

    def get_pending_campaigns(
        self,
        db: Session,
        limit: int = 20,
        offset: int = 0
    ) -> list[Campaign]:
        return (
            db.query(Campaign)
            .filter(Campaign.status == CampaignStatus.DRAFT)
            .order_by(Campaign.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def get_pending_count(self, db: Session) -> int:
        return (
            db.query(Campaign)
            .filter(Campaign.status == CampaignStatus.DRAFT)
            .count()
        )

    @staticmethod
    def _verify_paybill_with_directory_api(paybill_number: str) -> dict:
        return {
            "verified": True,
            "business_name": "Verified Business",
            "paybill_number": paybill_number,
            "status": "ACTIVE"
        }

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
