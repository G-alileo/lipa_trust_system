from sqlalchemy import (
    BigInteger, Integer, DateTime, Numeric,
    ForeignKey, Enum, Column, JSON, func
)

from core.db import Base
from domain.enums import TransactionStatus


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    contribution_id = Column(BigInteger, ForeignKey("contributions.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(Enum(TransactionStatus), nullable=False)
    attempts = Column(Integer, default=0)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
