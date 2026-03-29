from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from domain.enums import CampaignStatus


class SurplusRefundRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)


class SurplusCampaignInfo(BaseModel):
    id: int
    title: str
    owner_id: int
    status: CampaignStatus
    created_at: datetime

    class Config:
        from_attributes = True


class SurplusCampaignResponse(BaseModel):
    campaign: SurplusCampaignInfo
    target_amount: Decimal
    current_amount: Decimal
    surplus_amount: Decimal


class SurplusRefundResponse(BaseModel):
    campaign_id: int
    amount_refunded: Decimal
    refunds_created: int
    message: str


class SurplusHoldResponse(BaseModel):
    campaign_id: int
    surplus_amount: Decimal
    status: str
    message: str
