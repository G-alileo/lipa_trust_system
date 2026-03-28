from sqlalchemy import (
    BigInteger, String, DateTime, Numeric,
    ForeignKey, Enum, Column, func
)

from core.db import Base
from domain.enums import EntryType


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id"), nullable=False)
    reference_id = Column(String(100), nullable=False)
    account = Column(String(50), nullable=False, index=True)
    entry_type = Column(Enum(EntryType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Account(Base):
    __tablename__ = "accounts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
