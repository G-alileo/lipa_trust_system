from sqlalchemy import BigInteger, String, DateTime, Column, JSON, func

from core.db import Base


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    key = Column(String(255), primary_key=True)
    created_at = Column(DateTime, server_default=func.now())


class FailedTransaction(Base):
    __tablename__ = "failed_transactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reference_type = Column(String(50), nullable=False)
    reference_id = Column(String(100), nullable=False)
    reason = Column(String(500), nullable=True)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
