from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_admin_user
from modules.users.models import User
from modules.admin.surplus_admin_service import (
    SurplusAdminService,
    SurplusAdminError,
    CampaignNotFoundError,
    NoSurplusError,
)
from schemas.admin.surplus import (
    SurplusRefundRequest,
    SurplusCampaignResponse,
    SurplusCampaignInfo,
    SurplusRefundResponse,
    SurplusHoldResponse,
)
from schemas.base import APIResponse

router = APIRouter(prefix="/admin/surplus", tags=["Admin - Surplus"])

surplus_admin_service = SurplusAdminService()


@router.get("/campaigns", response_model=APIResponse)
def list_surplus_campaigns(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    surplus_data = surplus_admin_service.get_surplus_campaigns(db, limit, offset)
    total = surplus_admin_service.get_surplus_count(db)

    items = []
    for data in surplus_data:
        campaign = data["campaign"]
        items.append(SurplusCampaignResponse(
            campaign=SurplusCampaignInfo.model_validate(campaign),
            target_amount=data["target_amount"],
            current_amount=data["current_amount"],
            surplus_amount=data["surplus_amount"]
        ))

    return APIResponse.ok({
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset
    })


@router.post("/campaigns/{campaign_id}/refund", response_model=APIResponse[SurplusRefundResponse])
def approve_surplus_refund(
    campaign_id: int,
    payload: SurplusRefundRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    try:
        refunds = surplus_admin_service.approve_surplus_refund(
            db=db,
            campaign_id=campaign_id,
            admin_id=admin_user.id,
            amount_to_refund=payload.amount
        )

        return APIResponse.ok(SurplusRefundResponse(
            campaign_id=campaign_id,
            amount_refunded=payload.amount,
            refunds_created=len(refunds),
            message="Surplus refund approved and queued"
        ))

    except CampaignNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    except NoSurplusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except SurplusAdminError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/campaigns/{campaign_id}/hold", response_model=APIResponse[SurplusHoldResponse])
def hold_surplus(
    campaign_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    try:
        campaign = surplus_admin_service.hold_surplus(
            db=db,
            campaign_id=campaign_id,
            admin_id=admin_user.id
        )

        surplus = surplus_admin_service.surplus_service.get_surplus_amount(db, campaign_id)

        return APIResponse.ok(SurplusHoldResponse(
            campaign_id=campaign.id,
            surplus_amount=surplus,
            status="HELD",
            message="Surplus marked as held by admin"
        ))

    except CampaignNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    except NoSurplusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
