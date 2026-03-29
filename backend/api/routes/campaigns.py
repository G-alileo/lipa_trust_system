from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_user, get_current_admin_user
from domain.enums import CampaignStatus
from modules.campaigns.models import Campaign
from modules.campaigns.service import CampaignService, CampaignNotFoundError
from modules.users.models import User
from schemas.campaign import CampaignCreate, CampaignResponse
from schemas.base import APIResponse

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.get("/public", response_model=APIResponse[List[CampaignResponse]])
def list_public_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).filter(
        Campaign.status.in_([CampaignStatus.ACTIVE, CampaignStatus.COMPLETED])
    ).all()
    return APIResponse.ok([CampaignResponse.model_validate(c) for c in campaigns])


@router.get("/public/{campaign_id}", response_model=APIResponse[CampaignResponse])
def get_public_campaign(campaign_id: int, db: Session = Depends(get_db)):
    try:
        campaign = CampaignService.get_campaign(db, campaign_id)
    except CampaignNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    if campaign.status not in (CampaignStatus.ACTIVE, CampaignStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    return APIResponse.ok(CampaignResponse.model_validate(campaign))


@router.post("/", response_model=APIResponse[CampaignResponse])
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = Campaign(
        owner_id=current_user.id,
        title=payload.title,
        description=payload.description,
        target_amount=payload.target_amount,
        current_amount=Decimal("0"),
        status=CampaignStatus.DRAFT,
        deadline=payload.deadline,
        paybill_number=payload.paybill_number,
        account_reference=payload.account_reference,
        is_verified=False
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return APIResponse.ok(CampaignResponse.model_validate(campaign))


@router.get("/", response_model=APIResponse[List[CampaignResponse]])
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaigns = db.query(Campaign).filter(
        Campaign.status.in_([CampaignStatus.ACTIVE, CampaignStatus.COMPLETED])
    ).all()

    return APIResponse.ok([CampaignResponse.model_validate(c) for c in campaigns])


@router.get("/my", response_model=APIResponse[List[CampaignResponse]])
def list_my_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaigns = db.query(Campaign).filter(Campaign.owner_id == current_user.id).all()

    return APIResponse.ok([CampaignResponse.model_validate(c) for c in campaigns])


@router.get("/{campaign_id}", response_model=APIResponse[CampaignResponse])
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        campaign = CampaignService.get_campaign(db, campaign_id)
    except CampaignNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    return APIResponse.ok(CampaignResponse.model_validate(campaign))


@router.post("/{campaign_id}/verify", response_model=APIResponse[CampaignResponse])
def verify_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    try:
        campaign = CampaignService.get_campaign_for_update(db, campaign_id)
    except CampaignNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )

    campaign.is_verified = True
    campaign.status = CampaignStatus.ACTIVE
    db.commit()
    db.refresh(campaign)

    return APIResponse.ok(CampaignResponse.model_validate(campaign))
