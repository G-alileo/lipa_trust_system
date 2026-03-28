from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from domain.enums import CampaignStatus


class CampaignVerifyRequest(BaseModel):
    verified: bool = True
    notes: Optional[str] = None


class CampaignRejectRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)


class CampaignPendingResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    description: Optional[str] = None
    target_amount: Decimal
    current_amount: Decimal
    status: CampaignStatus
    deadline: Optional[datetime] = None
    paybill_number: str
    account_reference: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignVerifyResponse(BaseModel):
    id: int
    title: str
    status: CampaignStatus
    is_verified: bool
    message: str

    class Config:
        from_attributes = True
