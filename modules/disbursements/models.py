from sqlalchemy import (
    BigInteger, String, DateTime, Numeric,
    ForeignKey, Enum, Column, JSON, func
)

from core.db import Base
from domain.enums import TransactionStatus


class Disbursement(Base):
    __tablename__ = "disbursements"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(TransactionStatus), nullable=False)
    conversation_id = Column(String(100), nullable=True)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
