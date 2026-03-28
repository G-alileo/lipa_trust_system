from sqlalchemy import (
    BigInteger, String, Boolean, DateTime, Numeric, Text,
    ForeignKey, Enum, Column, func
)

from core.db import Base
from domain.enums import CampaignStatus


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    owner_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    target_amount = Column(Numeric(12, 2), nullable=False)
    current_amount = Column(Numeric(12, 2), default=0)
    status = Column(Enum(CampaignStatus), nullable=False, index=True)
    deadline = Column(DateTime, nullable=True)
    paybill_number = Column(String(20), nullable=False)
    account_reference = Column(String(50), nullable=False)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
