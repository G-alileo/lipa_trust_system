from typing import Optional
from sqlalchemy.orm import Session

from domain.enums import CampaignStatus, TransactionStatus
from modules.campaigns.models import Campaign
from modules.contributions.models import Contribution
from modules.refunds.models import Refund
from modules.users.models import User
from modules.system.models import FailedTransaction
from modules.refunds.service import RefundService


class RefundApprovalError(Exception):
    pass


class RefundNotFoundError(RefundApprovalError):
    pass


class InvalidRefundStatusError(RefundApprovalError):
    pass


class RefundApprovalService:

    def __init__(self):
        self.refund_service = RefundService()

    def get_pending_refunds(
        self,
        db: Session,
        limit: int = 20,
        offset: int = 0
    ) -> list[dict]:
        refunds = (
            db.query(Refund)
            .filter(Refund.status == TransactionStatus.PENDING)
            .order_by(Refund.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        results = []
        for refund in refunds:
            contribution = (
                db.query(Contribution)
                .filter(Contribution.id == refund.contribution_id)
                .first()
            )

            user = None
            campaign = None
            if contribution:
                user = db.query(User).filter(User.id == contribution.user_id).first()
                campaign = (
                    db.query(Campaign)
                    .filter(Campaign.id == contribution.campaign_id)
                    .first()
                )

            results.append({
                "refund": refund,
                "contribution": contribution,
                "user": user,
                "campaign": campaign
            })

        return results

    def get_pending_count(self, db: Session) -> int:
        return (
            db.query(Refund)
            .filter(Refund.status == TransactionStatus.PENDING)
            .count()
        )

    def approve_refund(
        self,
        db: Session,
        refund_id: int,
        admin_id: int
    ) -> Refund:
        refund = (
            db.query(Refund)
            .filter(Refund.id == refund_id)
            .with_for_update()
            .first()
        )

        if not refund:
            raise RefundNotFoundError(f"Refund {refund_id} not found")

        if refund.status != TransactionStatus.PENDING:
            raise InvalidRefundStatusError(
                f"Refund must be PENDING. Current: {refund.status}"
            )

        self._create_audit_log(
            db,
            action="REFUND_APPROVED",
            reference_id=str(refund_id),
            admin_id=admin_id,
            details={
                "refund_id": refund_id,
                "amount": str(refund.amount),
                "contribution_id": refund.contribution_id
            }
        )

        db.commit()

        self.refund_service.process_pending_refund(db, refund_id)

        return refund

    def reject_refund(
        self,
        db: Session,
        refund_id: int,
        admin_id: int,
        reason: str
    ) -> Refund:
        refund = (
            db.query(Refund)
            .filter(Refund.id == refund_id)
            .with_for_update()
            .first()
        )

        if not refund:
            raise RefundNotFoundError(f"Refund {refund_id} not found")

        if refund.status != TransactionStatus.PENDING:
            raise InvalidRefundStatusError(
                f"Refund must be PENDING. Current: {refund.status}"
            )

        refund.status = TransactionStatus.FAILED

        self._create_audit_log(
            db,
            action="REFUND_REJECTED",
            reference_id=str(refund_id),
            admin_id=admin_id,
            details={
                "refund_id": refund_id,
                "amount": str(refund.amount),
                "reason": reason
            }
        )

        db.commit()
        return refund

    def approve_campaign_refund(
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
            raise RefundApprovalError(f"Campaign {campaign_id} not found")

        if campaign.status not in (CampaignStatus.FAILED, CampaignStatus.REFUND_PENDING):
            raise RefundApprovalError(
                f"Campaign must be FAILED or REFUND_PENDING. Current: {campaign.status}"
            )

        self.refund_service.queue_refunds(db, campaign_id)

        if campaign.status != CampaignStatus.REFUND_PENDING:
            campaign.status = CampaignStatus.REFUND_PENDING

        self._create_audit_log(
            db,
            action="CAMPAIGN_REFUND_APPROVED",
            reference_id=str(campaign_id),
            admin_id=admin_id,
            details={
                "campaign_id": campaign_id,
                "current_amount": str(campaign.current_amount)
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
