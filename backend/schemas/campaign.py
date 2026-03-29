from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from domain.enums import CampaignStatus


class CampaignCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    target_amount: Decimal = Field(..., gt=0)
    deadline: Optional[datetime] = None
    paybill_number: str = Field(..., min_length=1, max_length=20)
    account_reference: str = Field(..., min_length=1, max_length=50)


class CampaignResponse(BaseModel):
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
