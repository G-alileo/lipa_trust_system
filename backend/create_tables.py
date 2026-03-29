from core.db import Base, engine

from modules.users.models import User
from modules.campaigns.models import Campaign
from modules.contributions.models import Contribution
from modules.refunds.models import Refund
from modules.ledger.models import LedgerEntry, Account
from modules.vouches.models import Vouch
from modules.disbursements.models import Disbursement
from modules.system.models import FailedTransaction, IdempotencyKey


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


if __name__ == "__main__":
    create_tables()