from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_user
from modules.contributions.service import (
    ContributionService,
    ContributionError,
    ContributionNotFoundError,
    DuplicateReceiptError
)
from modules.campaigns.service import CampaignError
from modules.users.models import User
from schemas.contribution import ContributionCreate, ContributionResponse, MpesaCallbackPayload
from schemas.base import APIResponse

router = APIRouter(prefix="/contributions", tags=["Contributions"])

contribution_service = ContributionService()


@router.post("/initiate", response_model=APIResponse[ContributionResponse])
def initiate_contribution(
    payload: ContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        contribution = contribution_service.initiate_contribution(
            db=db,
            user_id=current_user.id,
            campaign_id=payload.campaign_id,
            amount=payload.amount,
            phone_number=payload.phone_number
        )
    except CampaignError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ContributionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return APIResponse.ok(ContributionResponse.model_validate(contribution))


@router.post("/callback/mpesa")
def mpesa_callback(
    payload: MpesaCallbackPayload,
    db: Session = Depends(get_db)
):
    try:
        contribution_service.handle_payment_callback(
            db=db,
            payload=payload.model_dump()
        )
    except DuplicateReceiptError:
        pass
    except Exception:
        pass

    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@router.get("/my", response_model=APIResponse[List[ContributionResponse]])
def list_my_contributions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contributions = contribution_service.get_contributions_by_user(
        db=db,
        user_id=current_user.id
    )

    return APIResponse.ok([ContributionResponse.model_validate(c) for c in contributions])


@router.get("/{contribution_id}", response_model=APIResponse[ContributionResponse])
def get_contribution(
    contribution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        contribution = contribution_service.get_contribution(db, contribution_id)
    except ContributionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution not found"
        )

    if contribution.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return APIResponse.ok(ContributionResponse.model_validate(contribution))
