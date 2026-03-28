from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, Field

from domain.enums import ContributionStatus


class ContributionCreate(BaseModel):
    campaign_id: int
    amount: Decimal = Field(..., gt=0)
    phone_number: str = Field(..., min_length=10, max_length=20)


class ContributionResponse(BaseModel):
    id: int
    campaign_id: int
    user_id: int
    amount: Decimal
    mpesa_receipt: Optional[str] = None
    checkout_request_id: Optional[str] = None
    status: ContributionStatus
    created_at: datetime

    class Config:
        from_attributes = True


class MpesaCallbackPayload(BaseModel):
    Body: dict[str, Any]
