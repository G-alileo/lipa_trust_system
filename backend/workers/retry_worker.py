from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from core.db import SessionLocal
from domain.enums import TransactionStatus, ContributionStatus
from modules.disbursements.models import Disbursement
from modules.contributions.models import Contribution
from modules.payments.mpesa_client import PaymentService
from modules.system.models import FailedTransaction


class RetryWorker:

    DISBURSEMENT_STUCK_MINUTES = 30
    CONTRIBUTION_EXPIRED_MINUTES = 10

    def __init__(self):
        self.payment_service = PaymentService()

    def retry_failed_disbursements(self) -> dict:
        db = SessionLocal()
        results = {"reconciled": 0, "failed": 0}

        try:
            stuck_threshold = datetime.utcnow() - timedelta(minutes=self.DISBURSEMENT_STUCK_MINUTES)

            stuck_disbursements = (
                db.query(Disbursement)
                .filter(
                    Disbursement.status == TransactionStatus.PROCESSING,
                    Disbursement.created_at < stuck_threshold
                )
                .all()
            )

            for disbursement in stuck_disbursements:
                try:
                    self._reconcile_disbursement(db, disbursement)
                    results["reconciled"] += 1
                except Exception as e:
                    results["failed"] += 1
                    self._record_failure(
                        db,
                        reference_type="DISBURSEMENT_RETRY",
                        reference_id=str(disbursement.id),
                        reason=str(e)
                    )
                    db.commit()

        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

        return results

    def _reconcile_disbursement(self, db: Session, disbursement: Disbursement) -> None:
        disbursement = (
            db.query(Disbursement)
            .filter(Disbursement.id == disbursement.id)
            .with_for_update()
            .first()
        )

        if not disbursement or disbursement.status != TransactionStatus.PROCESSING:
            return

        if disbursement.conversation_id:
            status_response = self.payment_service.query_transaction_status(
                disbursement.conversation_id
            )

            if status_response.get("transaction_status") == "Completed":
                disbursement.status = TransactionStatus.COMPLETED
                disbursement.raw_payload = status_response
            elif status_response.get("result_code") != "0":
                disbursement.status = TransactionStatus.FAILED
                disbursement.raw_payload = status_response
                self._create_admin_notification(
                    db,
                    notification_type="DISBURSEMENT_FAILED",
                    reference_id=str(disbursement.id),
                    message=f"Disbursement {disbursement.id} failed after retry"
                )
        else:
            disbursement.status = TransactionStatus.FAILED
            self._create_admin_notification(
                db,
                notification_type="DISBURSEMENT_NO_CONVERSATION",
                reference_id=str(disbursement.id),
                message=f"Disbursement {disbursement.id} has no conversation_id"
            )

        db.commit()

    def retry_failed_contributions(self) -> dict:
        db = SessionLocal()
        results = {"expired": 0}

        try:
            expired_threshold = datetime.utcnow() - timedelta(minutes=self.CONTRIBUTION_EXPIRED_MINUTES)

            stale_contributions = (
                db.query(Contribution)
                .filter(
                    Contribution.status == ContributionStatus.PENDING,
                    Contribution.created_at < expired_threshold
                )
                .all()
            )

            for contribution in stale_contributions:
                try:
                    self._expire_contribution(db, contribution)
                    results["expired"] += 1
                except Exception as e:
                    self._record_failure(
                        db,
                        reference_type="CONTRIBUTION_EXPIRE",
                        reference_id=str(contribution.id),
                        reason=str(e)
                    )
                    db.commit()

        except Exception as e:
            db.rollback()
            raise
        finally:
            db.close()

        return results

    def _expire_contribution(self, db: Session, contribution: Contribution) -> None:
        contribution = (
            db.query(Contribution)
            .filter(Contribution.id == contribution.id)
            .with_for_update()
            .first()
        )

        if not contribution or contribution.status != ContributionStatus.PENDING:
            return

        contribution.status = ContributionStatus.FAILED

        self._record_failure(
            db,
            reference_type="CONTRIBUTION_EXPIRED",
            reference_id=str(contribution.id),
            reason="Payment not received within timeout period"
        )

        db.commit()

    @staticmethod
    def _record_failure(
        db: Session,
        reference_type: str,
        reference_id: str,
        reason: str
    ) -> FailedTransaction:
        failed = FailedTransaction(
            reference_type=reference_type,
            reference_id=reference_id,
            reason=reason[:500] if reason else None
        )
        db.add(failed)
        db.flush()
        return failed

    @staticmethod
    def _create_admin_notification(
        db: Session,
        notification_type: str,
        reference_id: str,
        message: str
    ) -> FailedTransaction:
        notification = FailedTransaction(
            reference_type=notification_type,
            reference_id=reference_id,
            reason=message[:500]
        )
        db.add(notification)
        db.flush()
        return notification


def run_retry_worker():
    worker = RetryWorker()
    disbursement_results = worker.retry_failed_disbursements()
    contribution_results = worker.retry_failed_contributions()
    return {
        "disbursements": disbursement_results,
        "contributions": contribution_results
    }
