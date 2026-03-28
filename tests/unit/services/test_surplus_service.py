from decimal import Decimal
from unittest.mock import Mock

import pytest

from domain.enums import CampaignStatus, ContributionStatus, TransactionStatus
from modules.campaigns.surplus_service import SurplusService, SurplusError


class TestSurplusService:

    def test_handle_surplus_calculates_correctly(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.status = CampaignStatus.COMPLETED
        sample_campaign.current_amount = Decimal("1200.00")
        sample_campaign.target_amount = Decimal("1000.00")

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        surplus = surplus_service_instance.handle_surplus(
            db=mock_db_session,
            campaign_id=1
        )

        assert surplus == Decimal("200.00")
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

    def test_handle_surplus_no_surplus(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.status = CampaignStatus.COMPLETED
        sample_campaign.current_amount = Decimal("1000.00")
        sample_campaign.target_amount = Decimal("1000.00")

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        surplus = surplus_service_instance.handle_surplus(
            db=mock_db_session,
            campaign_id=1
        )

        assert surplus is None
        mock_db_session.commit.assert_not_called()

    def test_handle_surplus_under_target(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.status = CampaignStatus.COMPLETED
        sample_campaign.current_amount = Decimal("800.00")
        sample_campaign.target_amount = Decimal("1000.00")

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        surplus = surplus_service_instance.handle_surplus(
            db=mock_db_session,
            campaign_id=1
        )

        assert surplus is None

    def test_handle_surplus_campaign_not_completed(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.current_amount = Decimal("1200.00")
        sample_campaign.target_amount = Decimal("1000.00")

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        surplus = surplus_service_instance.handle_surplus(
            db=mock_db_session,
            campaign_id=1
        )

        assert surplus is None

    def test_handle_surplus_campaign_not_found(
        self,
        mock_db_session,
        surplus_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        with pytest.raises(SurplusError, match="Campaign 1 not found"):
            surplus_service_instance.handle_surplus(
                db=mock_db_session,
                campaign_id=1
            )

    def test_admin_approve_surplus_refund_success(
        self,
        mock_db_session,
        sample_campaign,
        sample_contribution,
        surplus_service_instance
    ):
        sample_campaign.current_amount = Decimal("1200.00")
        sample_campaign.target_amount = Decimal("1000.00")

        contribution1 = sample_contribution
        contribution1.amount = Decimal("600.00")
        contribution1.status = ContributionStatus.COMPLETED

        contribution2 = Mock()
        contribution2.id = 2
        contribution2.amount = Decimal("600.00")
        contribution2.status = ContributionStatus.COMPLETED

        contributions = [contribution1, contribution2]

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
                mock_contrib_filter.all.return_value = contributions
                return mock_contrib_query

        mock_db_session.query.side_effect = query_side_effect

        refunds = surplus_service_instance.admin_approve_surplus_refund(
            db=mock_db_session,
            campaign_id=1,
            amount_to_refund=Decimal("150.00")
        )

        assert len(refunds) == 2
        assert mock_db_session.add.call_count == 2
        mock_db_session.commit.assert_called_once()

    def test_admin_approve_surplus_refund_no_surplus(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.current_amount = Decimal("1000.00")
        sample_campaign.target_amount = Decimal("1000.00")

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        with pytest.raises(SurplusError, match="No surplus to refund"):
            surplus_service_instance.admin_approve_surplus_refund(
                db=mock_db_session,
                campaign_id=1,
                amount_to_refund=Decimal("50.00")
            )

    def test_admin_approve_surplus_refund_exceeds_surplus(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.current_amount = Decimal("1100.00")
        sample_campaign.target_amount = Decimal("1000.00")

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        with pytest.raises(SurplusError, match="exceeds surplus"):
            surplus_service_instance.admin_approve_surplus_refund(
                db=mock_db_session,
                campaign_id=1,
                amount_to_refund=Decimal("200.00")
            )

    def test_admin_approve_surplus_refund_no_contributions(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.current_amount = Decimal("1200.00")
        sample_campaign.target_amount = Decimal("1000.00")

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

        refunds = surplus_service_instance.admin_approve_surplus_refund(
            db=mock_db_session,
            campaign_id=1,
            amount_to_refund=Decimal("100.00")
        )

        assert len(refunds) == 0

    def test_get_surplus_amount(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.current_amount = Decimal("1300.00")
        sample_campaign.target_amount = Decimal("1000.00")

        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = sample_campaign

        surplus = surplus_service_instance.get_surplus_amount(
            db=mock_db_session,
            campaign_id=1
        )

        assert surplus == Decimal("300.00")

    def test_get_surplus_amount_no_surplus(
        self,
        mock_db_session,
        sample_campaign,
        surplus_service_instance
    ):
        sample_campaign.current_amount = Decimal("900.00")
        sample_campaign.target_amount = Decimal("1000.00")

        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = sample_campaign

        surplus = surplus_service_instance.get_surplus_amount(
            db=mock_db_session,
            campaign_id=1
        )

        assert surplus == Decimal("0")
