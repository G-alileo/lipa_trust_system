from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_admin_user
from modules.users.models import User
from modules.admin.refund_approval_service import (
    RefundApprovalService,
    RefundApprovalError,
    RefundNotFoundError,
    InvalidRefundStatusError,
)
from schemas.admin.refund import (
    RefundRejectRequest,
    RefundPendingResponse,
    RefundApproveResponse,
    RefundUserInfo,
    RefundCampaignInfo,
    RefundContributionInfo,
)
from schemas.base import APIResponse

router = APIRouter(prefix="/admin/refunds", tags=["Admin - Refunds"])

refund_approval_service = RefundApprovalService()


@router.get("/pending", response_model=APIResponse)
def list_pending_refunds(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    refunds_data = refund_approval_service.get_pending_refunds(db, limit, offset)
    total = refund_approval_service.get_pending_count(db)

    items = []
    for data in refunds_data:
        refund = data["refund"]
        user = data.get("user")
        campaign = data.get("campaign")
        contribution = data.get("contribution")

        item = RefundPendingResponse(
            id=refund.id,
            contribution_id=refund.contribution_id,
            amount=refund.amount,
            status=refund.status,
            attempts=refund.attempts,
            created_at=refund.created_at,
            user=RefundUserInfo.model_validate(user) if user else None,
            campaign=RefundCampaignInfo.model_validate(campaign) if campaign else None,
            contribution=RefundContributionInfo.model_validate(contribution) if contribution else None
        )
        items.append(item)

    return APIResponse.ok({
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    })


@router.post("/{refund_id}/approve", response_model=APIResponse[RefundApproveResponse])
def approve_refund(
    refund_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    try:
        refund = refund_approval_service.approve_refund(
            db=db,
            refund_id=refund_id,
            admin_id=admin_user.id
        )

        return APIResponse.ok(RefundApproveResponse(
            id=refund.id,
            status=refund.status,
            amount=refund.amount,
            message="Refund approved and processing initiated"
        ))

    except RefundNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refund not found"
        )
    except InvalidRefundStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{refund_id}/reject", response_model=APIResponse[RefundApproveResponse])
def reject_refund(
    refund_id: int,
    payload: RefundRejectRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    try:
        refund = refund_approval_service.reject_refund(
            db=db,
            refund_id=refund_id,
            admin_id=admin_user.id,
            reason=payload.reason
        )

        return APIResponse.ok(RefundApproveResponse(
            id=refund.id,
            status=refund.status,
            amount=refund.amount,
            message=f"Refund rejected: {payload.reason}"
        ))

    except RefundNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refund not found"
        )
    except InvalidRefundStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/campaigns/{campaign_id}/refund", response_model=APIResponse)
def approve_campaign_refund(
    campaign_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    try:
        campaign = refund_approval_service.approve_campaign_refund(
            db=db,
            campaign_id=campaign_id,
            admin_id=admin_user.id
        )

        return APIResponse.ok({
            "campaign_id": campaign.id,
            "status": campaign.status.value,
            "message": "Campaign refund process initiated"
        })

    except RefundApprovalError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
