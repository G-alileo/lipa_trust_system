from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_admin_user
from modules.users.models import User
from modules.admin.verification_service import (
    VerificationService,
    VerificationError,
    CampaignNotFoundError,
    InvalidCampaignStatusError,
)
from schemas.admin.campaign import (
    CampaignVerifyRequest,
    CampaignRejectRequest,
    CampaignPendingResponse,
    CampaignVerifyResponse,
)
from schemas.base import APIResponse

router = APIRouter(prefix="/admin/campaigns", tags=["Admin - Campaigns"])

verification_service = VerificationService()


@router.get("/pending", response_model=APIResponse)
def list_pending_campaigns(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    campaigns = verification_service.get_pending_campaigns(db, limit, offset)
    total = verification_service.get_pending_count(db)

    return APIResponse.ok({
        "items": [CampaignPendingResponse.model_validate(c) for c in campaigns],
        "total": total,
        "limit": limit,
        "offset": offset
    })


@router.post("/{campaign_id}/verify", response_model=APIResponse[CampaignVerifyResponse])
def verify_campaign(
    campaign_id: int,
    payload: CampaignVerifyRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    try:
        campaign = verification_service.verify_campaign_paybill(
            db=db,
            campaign_id=campaign_id,
            admin_id=admin_user.id,
            notes=payload.notes
        )

        return APIResponse.ok(CampaignVerifyResponse(
            id=campaign.id,
            title=campaign.title,
            status=campaign.status,
            is_verified=campaign.is_verified,
            message="Campaign verified and activated successfully"
        ))

    except CampaignNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    except InvalidCampaignStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except VerificationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{campaign_id}/reject", response_model=APIResponse[CampaignVerifyResponse])
def reject_campaign(
    campaign_id: int,
    payload: CampaignRejectRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    try:
        campaign = verification_service.reject_campaign(
            db=db,
            campaign_id=campaign_id,
            admin_id=admin_user.id,
            reason=payload.reason
        )

        return APIResponse.ok(CampaignVerifyResponse(
            id=campaign.id,
            title=campaign.title,
            status=campaign.status,
            is_verified=campaign.is_verified,
            message=f"Campaign rejected: {payload.reason}"
        ))

    except CampaignNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    except InvalidCampaignStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
