from sqlalchemy import (
    BigInteger, Boolean, DateTime, Numeric,
    ForeignKey, Column, func
)

from core.db import Base


class Vouch(Base):
    __tablename__ = "vouches"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    campaign_id = Column(BigInteger, ForeignKey("campaigns.id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    liability_amount = Column(Numeric(12, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
