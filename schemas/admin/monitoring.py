from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class FailedTransactionResponse(BaseModel):
    id: int
    reference_type: str
    reference_id: str
    reason: Optional[str] = None
    payload: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CampaignStats(BaseModel):
    active: int
    pending: int
    completed: int
    failed: int


class RefundStats(BaseModel):
    pending: int
    completed: int
    failed: int


class ContributionStats(BaseModel):
    total: int
    pending: int
    total_collected: str


class DisbursementStats(BaseModel):
    pending: int


class FailureStats(BaseModel):
    by_type: dict[str, int]
    total: int


class SystemStatsResponse(BaseModel):
    campaigns: CampaignStats
    refunds: RefundStats
    contributions: ContributionStats
    disbursements: DisbursementStats
    failures: FailureStats
