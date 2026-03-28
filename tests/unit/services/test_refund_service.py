from decimal import Decimal
from unittest.mock import Mock

import pytest

from domain.enums import CampaignStatus, ContributionStatus, TransactionStatus
from modules.refunds.service import RefundService, RefundError, RefundNotFoundError


class TestRefundService:

    def test_queue_refunds_success(
        self,
        mock_db_session,
        sample_campaign,
        sample_contribution,
        refund_service_instance
    ):
        sample_campaign.status = CampaignStatus.FAILED
        sample_campaign.current_amount = Decimal("200.00")

        contribution1 = sample_contribution
        contribution1.amount = Decimal("100.00")
        contribution1.status = ContributionStatus.COMPLETED

        contribution2 = Mock()
        contribution2.id = 2
        contribution2.amount = Decimal("100.00")
        contribution2.status = ContributionStatus.COMPLETED

        contributions = [contribution1, contribution2]

        mock_campaign_query = Mock()
        mock_campaign_filter = Mock()
        mock_campaign_with_for_update = Mock()

        mock_contrib_query = Mock()
        mock_contrib_filter = Mock()

        mock_refund_query = Mock()
        mock_refund_filter = Mock()

        def query_side_effect(model):
            if model.__name__ == "Campaign":
                mock_campaign_query.filter.return_value = mock_campaign_filter
                mock_campaign_filter.with_for_update.return_value = mock_campaign_with_for_update
                mock_campaign_with_for_update.first.return_value = sample_campaign
                return mock_campaign_query
            elif model.__name__ == "Contribution":
                mock_contrib_query.filter.return_value = mock_contrib_filter
                mock_contrib_filter.all.return_value = contributions
                return mock_contrib_query
            elif model.__name__ == "Refund":
                mock_refund_query.filter.return_value = mock_refund_filter
                mock_refund_filter.first.return_value = None
                return mock_refund_query

        mock_db_session.query.side_effect = query_side_effect

        refunds = refund_service_instance.queue_refunds(mock_db_session, 1)

        assert len(refunds) == 2
        assert sample_campaign.status == CampaignStatus.REFUND_PENDING
        assert mock_db_session.add.call_count == 2
        mock_db_session.commit.assert_called_once()

    def test_queue_refunds_no_contributions(
        self,
        mock_db_session,
        sample_campaign,
        refund_service_instance
    ):
        sample_campaign.status = CampaignStatus.FAILED

        mock_campaign_query = Mock()
        mock_campaign_filter = Mock()
        mock_campaign_with_for_update = Mock()

        mock_contrib_query = Mock()
        mock_contrib_filter = Mock()

        def query_side_effect(model):
            if model.__name__ == "Campaign":
                mock_campaign_query.filter.return_value = mock_campaign_filter
                mock_campaign_filter.with_for_update.return_value = mock_campaign_with_for_update
                mock_campaign_with_for_update.first.return_value = sample_campaign
                return mock_campaign_query
            elif model.__name__ == "Contribution":
                mock_contrib_query.filter.return_value = mock_contrib_filter
                mock_contrib_filter.all.return_value = []
                return mock_contrib_query

        mock_db_session.query.side_effect = query_side_effect

        refunds = refund_service_instance.queue_refunds(mock_db_session, 1)

        assert len(refunds) == 0

    def test_queue_refunds_wrong_campaign_status(
        self,
        mock_db_session,
        sample_campaign,
        refund_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE

        mock_campaign_query = Mock()
        mock_campaign_filter = Mock()
        mock_campaign_with_for_update = Mock()

        mock_db_session.query.return_value = mock_campaign_query
        mock_campaign_query.filter.return_value = mock_campaign_filter
        mock_campaign_filter.with_for_update.return_value = mock_campaign_with_for_update
        mock_campaign_with_for_update.first.return_value = sample_campaign

        with pytest.raises(RefundError):
            refund_service_instance.queue_refunds(mock_db_session, 1)

    def test_process_refund_pending(
        self,
        mock_db_session,
        sample_refund,
        sample_contribution,
        sample_user,
        refund_service_instance,
        mocker
    ):
        sample_refund.status = TransactionStatus.PENDING
        sample_refund.attempts = 0
        sample_contribution.user_id = 1

        mock_b2c_response = mocker.Mock()
        mock_b2c_response.success = False

        mock_payment_service = mocker.Mock()
        mock_payment_service.initiate_b2c_refund.return_value = mock_b2c_response
        refund_service_instance.payment_service = mock_payment_service

        mock_ledger_service = mocker.Mock()
        refund_service_instance.ledger_service = mock_ledger_service

        mock_refund_query = Mock()
        mock_refund_filter = Mock()
        mock_refund_with_for_update = Mock()

        mock_contrib_query = Mock()
        mock_contrib_filter = Mock()

        mock_user_query = Mock()
        mock_user_filter = Mock()

        def query_side_effect(model):
            if model.__name__ == "Refund":
                mock_refund_query.filter.return_value = mock_refund_filter
                mock_refund_filter.with_for_update.return_value = mock_refund_with_for_update
                mock_refund_with_for_update.first.return_value = sample_refund
                return mock_refund_query
            elif model.__name__ == "Contribution":
                mock_contrib_query.filter.return_value = mock_contrib_filter
                mock_contrib_filter.first.return_value = sample_contribution
                return mock_contrib_query
            elif model.__name__ == "User":
                mock_user_query.filter.return_value = mock_user_filter
                mock_user_filter.first.return_value = sample_user
                return mock_user_query

        mock_db_session.query.side_effect = query_side_effect

        result = refund_service_instance.process_pending_refund(mock_db_session, 1)

        assert result.status == TransactionStatus.PENDING
        assert result.attempts == 1
        mock_db_session.commit.assert_called()

    def test_process_refund_max_retries_exceeded(
        self,
        mock_db_session,
        sample_refund,
        refund_service_instance
    ):
        sample_refund.status = TransactionStatus.PENDING
        sample_refund.attempts = 3

        mock_refund_query = Mock()
        mock_refund_filter = Mock()
        mock_refund_with_for_update = Mock()

        mock_db_session.query.return_value = mock_refund_query
        mock_refund_query.filter.return_value = mock_refund_filter
        mock_refund_filter.with_for_update.return_value = mock_refund_with_for_update
        mock_refund_with_for_update.first.return_value = sample_refund

        result = refund_service_instance.process_pending_refund(mock_db_session, 1)

        assert result.status == TransactionStatus.FAILED
        mock_db_session.commit.assert_called_once()

    def test_get_pending_refunds(
        self,
        mock_db_session,
        sample_refund,
        refund_service_instance
    ):
        sample_refund.status = TransactionStatus.PENDING

        mock_query = Mock()
        mock_filter = Mock()
        mock_limit = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.limit.return_value = mock_limit
        mock_limit.all.return_value = [sample_refund]

        result = refund_service_instance.get_pending_refunds(mock_db_session)

        assert len(result) == 1
        assert result[0].status == TransactionStatus.PENDING

    def test_get_refund_success(
        self,
        mock_db_session,
        sample_refund,
        refund_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = sample_refund

        result = refund_service_instance.get_refund(mock_db_session, 1)

        assert result.id == sample_refund.id
        assert result.amount == sample_refund.amount

    def test_get_refund_not_found(
        self,
        mock_db_session,
        refund_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None

        with pytest.raises(RefundNotFoundError):
            refund_service_instance.get_refund(mock_db_session, 999)

    def test_process_refund_success(
        self,
        mock_db_session,
        sample_refund,
        sample_contribution,
        sample_user,
        refund_service_instance,
        mocker
    ):
        sample_refund.status = TransactionStatus.PENDING
        sample_refund.attempts = 0
        sample_contribution.user_id = 1

        mock_b2c_response = mocker.Mock()
        mock_b2c_response.success = True
        mock_b2c_response.conversation_id = "AG_SUCCESS"
        mock_b2c_response.response_code = "0"

        mock_payment_service = mocker.Mock()
        mock_payment_service.initiate_b2c_refund.return_value = mock_b2c_response
        refund_service_instance.payment_service = mock_payment_service

        mock_ledger_service = mocker.Mock()
        refund_service_instance.ledger_service = mock_ledger_service

        def query_side_effect(model):
            if model.__name__ == "Refund":
                mock_query = Mock()
                mock_filter = Mock()
                mock_with_for_update = Mock()
                mock_query.filter.return_value = mock_filter
                mock_filter.with_for_update.return_value = mock_with_for_update
                mock_with_for_update.first.return_value = sample_refund
                return mock_query
            elif model.__name__ == "Contribution":
                mock_query = Mock()
                mock_filter = Mock()
                mock_query.filter.return_value = mock_filter
                mock_filter.first.return_value = sample_contribution
                return mock_query
            elif model.__name__ == "User":
                mock_query = Mock()
                mock_filter = Mock()
                mock_query.filter.return_value = mock_filter
                mock_filter.first.return_value = sample_user
                return mock_query

        mock_db_session.query.side_effect = query_side_effect

        result = refund_service_instance.process_pending_refund(mock_db_session, 1)

        assert result.status == TransactionStatus.COMPLETED
        assert result.attempts == 1
        mock_db_session.commit.assert_called()

    def test_process_refund_already_processed(
        self,
        mock_db_session,
        sample_refund,
        refund_service_instance
    ):
        sample_refund.status = TransactionStatus.COMPLETED

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_refund

        result = refund_service_instance.process_pending_refund(mock_db_session, 1)

        assert result.status == TransactionStatus.COMPLETED

    def test_process_refund_not_found(
        self,
        mock_db_session,
        refund_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        with pytest.raises(RefundNotFoundError):
            refund_service_instance.process_pending_refund(mock_db_session, 999)

    def test_check_campaign_refunds_complete_true(
        self,
        mock_db_session,
        refund_service_instance
    ):
        mock_query = Mock()
        mock_join = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.join.return_value = mock_join
        mock_join.filter.return_value = mock_filter
        mock_filter.count.return_value = 0

        result = refund_service_instance.check_campaign_refunds_complete(mock_db_session, 1)

        assert result is True

    def test_check_campaign_refunds_complete_false(
        self,
        mock_db_session,
        refund_service_instance
    ):
        mock_query = Mock()
        mock_join = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.join.return_value = mock_join
        mock_join.filter.return_value = mock_filter
        mock_filter.count.return_value = 3

        result = refund_service_instance.check_campaign_refunds_complete(mock_db_session, 1)

        assert result is False

    def test_finalize_campaign_refunds_success(
        self,
        mock_db_session,
        sample_campaign,
        refund_service_instance,
        mocker
    ):
        sample_campaign.status = CampaignStatus.REFUND_PENDING

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        mocker.patch.object(
            refund_service_instance,
            'check_campaign_refunds_complete',
            return_value=True
        )

        refund_service_instance.finalize_campaign_refunds(mock_db_session, 1)

        assert sample_campaign.status == CampaignStatus.REFUNDED
        mock_db_session.commit.assert_called_once()

    def test_finalize_campaign_refunds_incomplete(
        self,
        mock_db_session,
        sample_campaign,
        refund_service_instance,
        mocker
    ):
        sample_campaign.status = CampaignStatus.REFUND_PENDING

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        mocker.patch.object(
            refund_service_instance,
            'check_campaign_refunds_complete',
            return_value=False
        )

        refund_service_instance.finalize_campaign_refunds(mock_db_session, 1)

        assert sample_campaign.status == CampaignStatus.REFUND_PENDING
        mock_db_session.commit.assert_not_called()

    def test_finalize_campaign_refunds_campaign_not_found(
        self,
        mock_db_session,
        refund_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        refund_service_instance.finalize_campaign_refunds(mock_db_session, 999)

        mock_db_session.commit.assert_not_called()

    def test_queue_refunds_existing_refund_skipped(
        self,
        mock_db_session,
        sample_campaign,
        sample_contribution,
        sample_refund,
        refund_service_instance
    ):
        sample_campaign.status = CampaignStatus.FAILED
        sample_campaign.current_amount = Decimal("100.00")

        sample_contribution.status = ContributionStatus.COMPLETED
        sample_contribution.amount = Decimal("100.00")

        mock_campaign_query = Mock()
        mock_campaign_filter = Mock()
        mock_campaign_with_for_update = Mock()

        mock_contrib_query = Mock()
        mock_contrib_filter = Mock()

        mock_refund_query = Mock()
        mock_refund_filter = Mock()

        def query_side_effect(model):
            if model.__name__ == "Campaign":
                mock_campaign_query.filter.return_value = mock_campaign_filter
                mock_campaign_filter.with_for_update.return_value = mock_campaign_with_for_update
                mock_campaign_with_for_update.first.return_value = sample_campaign
                return mock_campaign_query
            elif model.__name__ == "Contribution":
                mock_contrib_query.filter.return_value = mock_contrib_filter
                mock_contrib_filter.all.return_value = [sample_contribution]
                return mock_contrib_query
            elif model.__name__ == "Refund":
                mock_refund_query.filter.return_value = mock_refund_filter
                mock_refund_filter.first.return_value = sample_refund
                return mock_refund_query

        mock_db_session.query.side_effect = query_side_effect

        refunds = refund_service_instance.queue_refunds(mock_db_session, 1)

        assert len(refunds) == 0
        mock_db_session.add.assert_not_called()

    def test_queue_refunds_campaign_not_found(
        self,
        mock_db_session,
        refund_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        with pytest.raises(RefundError):
            refund_service_instance.queue_refunds(mock_db_session, 999)

    def test_queue_refunds_pro_rata_calculation(
        self,
        mock_db_session,
        sample_campaign,
        refund_service_instance
    ):
        sample_campaign.status = CampaignStatus.FAILED
        sample_campaign.current_amount = Decimal("150.00")

        # Create mock contributions
        contrib1 = Mock()
        contrib1.id = 1
        contrib1.amount = Decimal("100.00")
        contrib1.status = ContributionStatus.COMPLETED

        contrib2 = Mock()
        contrib2.id = 2
        contrib2.amount = Decimal("50.00")
        contrib2.status = ContributionStatus.COMPLETED

        contributions = [contrib1, contrib2]

        mock_campaign_query = Mock()
        mock_campaign_filter = Mock()
        mock_campaign_with_for_update = Mock()

        mock_contrib_query = Mock()
        mock_contrib_filter = Mock()

        mock_refund_query = Mock()
        mock_refund_filter = Mock()

        def query_side_effect(model):
            if model.__name__ == "Campaign":
                mock_campaign_query.filter.return_value = mock_campaign_filter
                mock_campaign_filter.with_for_update.return_value = mock_campaign_with_for_update
                mock_campaign_with_for_update.first.return_value = sample_campaign
                return mock_campaign_query
            elif model.__name__ == "Contribution":
                mock_contrib_query.filter.return_value = mock_contrib_filter
                mock_contrib_filter.all.return_value = contributions
                return mock_contrib_query
            elif model.__name__ == "Refund":
                mock_refund_query.filter.return_value = mock_refund_filter
                mock_refund_filter.first.return_value = None
                return mock_refund_query

        mock_db_session.query.side_effect = query_side_effect

        refunds = refund_service_instance.queue_refunds(mock_db_session, 1)

        assert len(refunds) == 2
        # First contribution: (100/150) * 150 = 100.00
        # Second contribution: (50/150) * 150 = 50.00
        expected_amounts = [Decimal("100.00"), Decimal("50.00")]
        actual_amounts = [r.amount for r in refunds]

        for expected in expected_amounts:
            assert expected in actual_amounts
