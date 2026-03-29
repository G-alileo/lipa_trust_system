from domain.enums import CampaignStatus, ContributionStatus, TransactionStatus, EntryType


class TestEnums:

    def test_campaign_status_values(self):
        assert CampaignStatus.DRAFT.value == "DRAFT"
        assert CampaignStatus.ACTIVE.value == "ACTIVE"
        assert CampaignStatus.PAUSED.value == "PAUSED"
        assert CampaignStatus.COMPLETED.value == "COMPLETED"
        assert CampaignStatus.CANCELLED.value == "CANCELLED"
        assert CampaignStatus.FAILED.value == "FAILED"
        assert CampaignStatus.REFUND_PENDING.value == "REFUND_PENDING"
        assert CampaignStatus.REFUNDED.value == "REFUNDED"

    def test_campaign_status_all_values_exist(self):
        expected_values = {
            "DRAFT", "ACTIVE", "PAUSED", "COMPLETED",
            "CANCELLED", "FAILED", "REFUND_PENDING", "REFUNDED"
        }
        actual_values = {status.value for status in CampaignStatus}
        assert actual_values == expected_values

    def test_contribution_status_values(self):
        assert ContributionStatus.PENDING.value == "PENDING"
        assert ContributionStatus.COMPLETED.value == "COMPLETED"
        assert ContributionStatus.FAILED.value == "FAILED"
        assert ContributionStatus.REFUNDED.value == "REFUNDED"

    def test_contribution_status_all_values_exist(self):
        expected_values = {"PENDING", "COMPLETED", "FAILED", "REFUNDED"}
        actual_values = {status.value for status in ContributionStatus}
        assert actual_values == expected_values

    def test_transaction_status_values(self):
        assert TransactionStatus.PENDING.value == "PENDING"
        assert TransactionStatus.PROCESSING.value == "PROCESSING"
        assert TransactionStatus.COMPLETED.value == "COMPLETED"
        assert TransactionStatus.FAILED.value == "FAILED"

    def test_transaction_status_all_values_exist(self):
        expected_values = {"PENDING", "PROCESSING", "COMPLETED", "FAILED"}
        actual_values = {status.value for status in TransactionStatus}
        assert actual_values == expected_values

    def test_entry_type_values(self):
        assert EntryType.DEBIT.value == "DEBIT"
        assert EntryType.CREDIT.value == "CREDIT"

    def test_entry_type_all_values_exist(self):
        expected_values = {"DEBIT", "CREDIT"}
        actual_values = {entry_type.value for entry_type in EntryType}
        assert actual_values == expected_values

    def test_campaign_status_is_string_enum(self):
        assert isinstance(CampaignStatus.ACTIVE, str)
        assert CampaignStatus.ACTIVE == "ACTIVE"

    def test_contribution_status_is_string_enum(self):
        assert isinstance(ContributionStatus.COMPLETED, str)
        assert ContributionStatus.COMPLETED == "COMPLETED"

    def test_transaction_status_is_string_enum(self):
        assert isinstance(TransactionStatus.PENDING, str)
        assert TransactionStatus.PENDING == "PENDING"

    def test_entry_type_is_string_enum(self):
        assert isinstance(EntryType.DEBIT, str)
        assert EntryType.DEBIT == "DEBIT"
