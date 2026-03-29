from sqlalchemy import (
    BigInteger, String, DateTime, Numeric,
    ForeignKey, Enum, Column, func
)

from core.db import Base
from domain.enums import ContributionStatus


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id"), nullable=False, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    mpesa_receipt = Column(String(50), unique=True, nullable=True)
    checkout_request_id = Column(String(100), unique=True, nullable=True)
    status = Column(Enum(ContributionStatus), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now())
