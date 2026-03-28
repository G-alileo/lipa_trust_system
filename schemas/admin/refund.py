from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from domain.enums import TransactionStatus


class RefundRejectRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class RefundUserInfo(BaseModel):
    id: int
    phone_number: str
    email: Optional[str] = None

    class Config:
        from_attributes = True


class RefundCampaignInfo(BaseModel):
    id: int
    title: str

    class Config:
        from_attributes = True


class RefundContributionInfo(BaseModel):
    id: int
    amount: Decimal
    mpesa_receipt: Optional[str] = None

    class Config:
        from_attributes = True


class RefundPendingResponse(BaseModel):
    id: int
    contribution_id: int
    amount: Decimal
    status: TransactionStatus
    attempts: int
    created_at: datetime
    user: Optional[RefundUserInfo] = None
    campaign: Optional[RefundCampaignInfo] = None
    contribution: Optional[RefundContributionInfo] = None

    class Config:
        from_attributes = True


class RefundApproveResponse(BaseModel):
    id: int
    status: TransactionStatus
    amount: Decimal
    message: str

    class Config:
        from_attributes = True
