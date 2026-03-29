from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from api.deps import get_db, get_current_admin_user
from modules.users.models import User
from modules.admin.monitoring_service import MonitoringService
from schemas.admin.monitoring import FailedTransactionResponse, SystemStatsResponse
from schemas.base import APIResponse

router = APIRouter(prefix="/admin/monitoring", tags=["Admin - Monitoring"])

monitoring_service = MonitoringService()


@router.get("/failures", response_model=APIResponse)
def list_failed_transactions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    reference_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    failures = monitoring_service.get_failed_transactions(
        db, limit, offset, reference_type
    )
    total = monitoring_service.get_failed_transactions_count(db, reference_type)

    return APIResponse.ok({
        "items": [FailedTransactionResponse.model_validate(f) for f in failures],
        "total": total,
        "limit": limit,
        "offset": offset
    })


@router.get("/stats", response_model=APIResponse[SystemStatsResponse])
def get_system_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    stats = monitoring_service.get_system_stats(db)

    return APIResponse.ok(SystemStatsResponse(
        campaigns=stats["campaigns"],
        refunds=stats["refunds"],
        contributions=stats["contributions"],
        disbursements=stats["disbursements"],
        failures=stats["failures"]
    ))


@router.get("/failures/types", response_model=APIResponse)
def get_failure_types(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    types = monitoring_service.get_failure_types(db)
    return APIResponse.ok({"types": types})


@router.get("/actions", response_model=APIResponse)
def list_admin_actions(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    actions = monitoring_service.get_recent_admin_actions(db, limit)

    return APIResponse.ok({
        "items": [FailedTransactionResponse.model_validate(a) for a in actions],
        "limit": limit
    })
