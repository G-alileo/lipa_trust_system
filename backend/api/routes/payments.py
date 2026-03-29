import logging
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/mpesa", tags=["M-Pesa"])
logger = logging.getLogger(__name__)


@router.post("/result")
def mpesa_result_callback(payload: dict[str, Any]):
    logger.info("Received Daraja result callback: %s", payload)
    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@router.post("/timeout")
def mpesa_timeout_callback(payload: dict[str, Any]):
    logger.warning("Received Daraja timeout callback: %s", payload)
    return {"ResultCode": 0, "ResultDesc": "Accepted"}
