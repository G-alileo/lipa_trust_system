from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.db import SessionLocal
from domain.enums import CampaignStatus, EntryType
from modules.campaigns.models import Campaign
from modules.ledger.models import LedgerEntry
from modules.system.models import FailedTransaction


class ReconciliationWorker:

    ACCOUNT_CAMPAIGN_FUNDS = "CAMPAIGN_FUNDS"
    ACCOUNT_CASH = "CASH"

    def verify_ledger_integrity(self) -> dict:
        db = SessionLocal()
        results = {"checked": 0, "mismatches": 0, "errors": []}

        try:
            campaigns = (
                db.query(Campaign)
                .filter(
                    Campaign.status.in_([
                        CampaignStatus.ACTIVE,
                        CampaignStatus.COMPLETED,
                        CampaignStatus.REFUND_PENDING
                    ])
                )
                .all()
            )

            for campaign in campaigns:
                try:
                    mismatch = self._verify_campaign_ledger(db, campaign)
                    results["checked"] += 1
                    if mismatch:
                        results["mismatches"] += 1
                        results["errors"].append(mismatch)
                except Exception as e:
                    self._record_failure(
                        db,
                        reference_type="RECONCILIATION_ERROR",
                        reference_id=str(campaign.id),
                        reason=str(e)
                    )
                    db.commit()

        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

        return results

    def _verify_campaign_ledger(self, db: Session, campaign: Campaign) -> dict:
        credit_sum = (
            db.query(func.coalesce(func.sum(LedgerEntry.amount), 0))
            .filter(
                LedgerEntry.campaign_id == campaign.id,
                LedgerEntry.account == self.ACCOUNT_CAMPAIGN_FUNDS,
                LedgerEntry.entry_type == EntryType.CREDIT
            )
            .scalar()
        ) or Decimal("0")

        debit_sum = (
            db.query(func.coalesce(func.sum(LedgerEntry.amount), 0))
            .filter(
                LedgerEntry.campaign_id == campaign.id,
                LedgerEntry.account == self.ACCOUNT_CAMPAIGN_FUNDS,
                LedgerEntry.entry_type == EntryType.DEBIT
            )
            .scalar()
        ) or Decimal("0")

        ledger_balance = credit_sum - debit_sum
        campaign_amount = campaign.current_amount or Decimal("0")

        if ledger_balance != campaign_amount:
            mismatch_info = {
                "campaign_id": campaign.id,
                "ledger_balance": str(ledger_balance),
                "campaign_amount": str(campaign_amount),
                "difference": str(ledger_balance - campaign_amount)
            }

            self._record_failure(
                db,
                reference_type="LEDGER_MISMATCH",
                reference_id=str(campaign.id),
                reason=f"Ledger balance {ledger_balance} != campaign amount {campaign_amount}",
                payload=mismatch_info
            )
            db.commit()

            return mismatch_info

        return None

    def verify_double_entry_balance(self) -> dict:
        db = SessionLocal()
        results = {"balanced": True, "total_debits": "0", "total_credits": "0"}

        try:
            total_debits = (
                db.query(func.coalesce(func.sum(LedgerEntry.amount), 0))
                .filter(LedgerEntry.entry_type == EntryType.DEBIT)
                .scalar()
            ) or Decimal("0")

            total_credits = (
                db.query(func.coalesce(func.sum(LedgerEntry.amount), 0))
                .filter(LedgerEntry.entry_type == EntryType.CREDIT)
                .scalar()
            ) or Decimal("0")

            results["total_debits"] = str(total_debits)
            results["total_credits"] = str(total_credits)
            results["balanced"] = total_debits == total_credits

            if not results["balanced"]:
                self._record_failure(
                    db,
                    reference_type="DOUBLE_ENTRY_IMBALANCE",
                    reference_id="GLOBAL",
                    reason=f"Total debits {total_debits} != total credits {total_credits}",
                    payload=results
                )
                db.commit()

        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

        return results

    @staticmethod
    def _record_failure(
        db: Session,
        reference_type: str,
        reference_id: str,
        reason: str,
        payload: dict = None
    ) -> FailedTransaction:
        failed = FailedTransaction(
            reference_type=reference_type,
            reference_id=reference_id,
            reason=reason[:500] if reason else None,
            payload=payload
        )
        db.add(failed)
        db.flush()
        return failed


def run_reconciliation_worker():
    worker = ReconciliationWorker()
    ledger_results = worker.verify_ledger_integrity()
    balance_results = worker.verify_double_entry_balance()
    return {
        "ledger_integrity": ledger_results,
        "double_entry_balance": balance_results
    }
