from decimal import Decimal

from sqlalchemy.orm import Session

from domain.enums import EntryType
from modules.ledger.models import LedgerEntry


class LedgerService:

    @staticmethod
    def create_entry(
        db: Session,
        campaign_id: int,
        reference_id: str,
        debit_account: str,
        credit_account: str,
        amount: Decimal
    ) -> tuple[LedgerEntry, LedgerEntry]:
        if amount <= 0:
            raise ValueError("Amount must be greater than zero")

        debit_entry = LedgerEntry(
            campaign_id=campaign_id,
            reference_id=reference_id,
            account=debit_account,
            entry_type=EntryType.DEBIT,
            amount=amount
        )

        credit_entry = LedgerEntry(
            campaign_id=campaign_id,
            reference_id=reference_id,
            account=credit_account,
            entry_type=EntryType.CREDIT,
            amount=amount
        )

        db.add(debit_entry)
        db.add(credit_entry)
        db.flush()

        return debit_entry, credit_entry
