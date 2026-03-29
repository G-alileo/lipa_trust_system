from decimal import Decimal

import pytest

from domain.enums import EntryType
from modules.ledger.service import LedgerService


class TestLedgerService:

    def test_create_entry_success(
        self,
        mock_db_session,
        ledger_service_instance
    ):
        debit_entry, credit_entry = ledger_service_instance.create_entry(
            db=mock_db_session,
            campaign_id=1,
            reference_id="TEST_REF_001",
            debit_account="CASH",
            credit_account="CAMPAIGN_FUNDS",
            amount=Decimal("100.00")
        )

        assert debit_entry.campaign_id == 1
        assert debit_entry.reference_id == "TEST_REF_001"
        assert debit_entry.account == "CASH"
        assert debit_entry.entry_type == EntryType.DEBIT
        assert debit_entry.amount == Decimal("100.00")

        assert credit_entry.campaign_id == 1
        assert credit_entry.reference_id == "TEST_REF_001"
        assert credit_entry.account == "CAMPAIGN_FUNDS"
        assert credit_entry.entry_type == EntryType.CREDIT
        assert credit_entry.amount == Decimal("100.00")

        assert mock_db_session.add.call_count == 2
        mock_db_session.flush.assert_called_once()

    def test_create_entry_same_reference_id(
        self,
        mock_db_session,
        ledger_service_instance
    ):
        debit_entry, credit_entry = ledger_service_instance.create_entry(
            db=mock_db_session,
            campaign_id=1,
            reference_id="SHARED_REF",
            debit_account="ACCOUNT_A",
            credit_account="ACCOUNT_B",
            amount=Decimal("250.00")
        )

        assert debit_entry.reference_id == credit_entry.reference_id
        assert debit_entry.reference_id == "SHARED_REF"

    def test_create_entry_zero_amount(
        self,
        mock_db_session,
        ledger_service_instance
    ):
        with pytest.raises(ValueError, match="Amount must be greater than zero"):
            ledger_service_instance.create_entry(
                db=mock_db_session,
                campaign_id=1,
                reference_id="TEST_REF",
                debit_account="ACCOUNT_A",
                credit_account="ACCOUNT_B",
                amount=Decimal("0.00")
            )

        mock_db_session.add.assert_not_called()

    def test_create_entry_negative_amount(
        self,
        mock_db_session,
        ledger_service_instance
    ):
        with pytest.raises(ValueError, match="Amount must be greater than zero"):
            ledger_service_instance.create_entry(
                db=mock_db_session,
                campaign_id=1,
                reference_id="TEST_REF",
                debit_account="ACCOUNT_A",
                credit_account="ACCOUNT_B",
                amount=Decimal("-100.00")
            )

        mock_db_session.add.assert_not_called()

    def test_create_entry_requires_both_accounts(
        self,
        mock_db_session,
        ledger_service_instance
    ):
        debit_entry, credit_entry = ledger_service_instance.create_entry(
            db=mock_db_session,
            campaign_id=1,
            reference_id="TEST_REF",
            debit_account="DEBIT_ACCOUNT",
            credit_account="CREDIT_ACCOUNT",
            amount=Decimal("50.00")
        )

        assert debit_entry.account == "DEBIT_ACCOUNT"
        assert credit_entry.account == "CREDIT_ACCOUNT"
        assert debit_entry is not None
        assert credit_entry is not None

    def test_create_entry_amounts_balance(
        self,
        mock_db_session,
        ledger_service_instance
    ):
        debit_entry, credit_entry = ledger_service_instance.create_entry(
            db=mock_db_session,
            campaign_id=1,
            reference_id="BALANCE_TEST",
            debit_account="ACC_X",
            credit_account="ACC_Y",
            amount=Decimal("500.00")
        )

        assert debit_entry.amount == credit_entry.amount

    def test_create_entry_decimal_precision(
        self,
        mock_db_session,
        ledger_service_instance
    ):
        debit_entry, credit_entry = ledger_service_instance.create_entry(
            db=mock_db_session,
            campaign_id=1,
            reference_id="PRECISION_TEST",
            debit_account="ACC_A",
            credit_account="ACC_B",
            amount=Decimal("99.99")
        )

        assert debit_entry.amount == Decimal("99.99")
        assert credit_entry.amount == Decimal("99.99")
