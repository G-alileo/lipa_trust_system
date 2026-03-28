from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock

import pytest

from domain.enums import CampaignStatus
from modules.campaigns.service import (
    CampaignService,
    CampaignNotFoundError,
    CampaignNotActiveError,
    CampaignDeadlinePassedError
)


class TestCampaignService:

    def test_get_campaign_for_update_success(
        self,
        mock_db_session,
        sample_campaign,
        campaign_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        result = campaign_service_instance.get_campaign_for_update(
            db=mock_db_session,
            campaign_id=1
        )

        assert result == sample_campaign
        mock_with_for_update.first.assert_called_once()

    def test_get_campaign_for_update_not_found(
        self,
        mock_db_session,
        campaign_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        with pytest.raises(CampaignNotFoundError):
            campaign_service_instance.get_campaign_for_update(
                db=mock_db_session,
                campaign_id=1
            )

    def test_validate_campaign_active_success(
        self,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.deadline = datetime.utcnow() + timedelta(days=7)

        campaign_service_instance.validate_campaign_active(sample_campaign)

    def test_validate_campaign_active_expired(
        self,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.deadline = datetime.utcnow() - timedelta(days=1)

        with pytest.raises(CampaignDeadlinePassedError):
            campaign_service_instance.validate_campaign_active(sample_campaign)

    def test_validate_campaign_active_wrong_status(
        self,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.status = CampaignStatus.COMPLETED
        sample_campaign.deadline = datetime.utcnow() + timedelta(days=7)

        with pytest.raises(CampaignNotActiveError):
            campaign_service_instance.validate_campaign_active(sample_campaign)

    def test_can_accept_contribution_under_target(
        self,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.current_amount = Decimal("500.00")
        sample_campaign.target_amount = Decimal("1000.00")
        sample_campaign.deadline = datetime.utcnow() + timedelta(days=7)

        result = campaign_service_instance.can_accept_contribution(
            campaign=sample_campaign,
            amount=Decimal("100.00")
        )

        assert result is True

    def test_can_accept_contribution_at_target(
        self,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.status = CampaignStatus.COMPLETED
        sample_campaign.current_amount = Decimal("1000.00")
        sample_campaign.target_amount = Decimal("1000.00")
        sample_campaign.deadline = datetime.utcnow() + timedelta(days=7)

        result = campaign_service_instance.can_accept_contribution(
            campaign=sample_campaign,
            amount=Decimal("100.00")
        )

        assert result is False

    def test_can_accept_contribution_deadline_passed(
        self,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.current_amount = Decimal("500.00")
        sample_campaign.target_amount = Decimal("1000.00")
        sample_campaign.deadline = datetime.utcnow() - timedelta(days=1)

        result = campaign_service_instance.can_accept_contribution(
            campaign=sample_campaign,
            amount=Decimal("100.00")
        )

        assert result is False

    def test_increment_amount_success(
        self,
        mock_db_session,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.current_amount = Decimal("500.00")

        campaign_service_instance.increment_amount(
            db=mock_db_session,
            campaign=sample_campaign,
            amount=Decimal("100.00")
        )

        assert sample_campaign.current_amount == Decimal("600.00")
        mock_db_session.flush.assert_called_once()

    def test_increment_amount_from_zero(
        self,
        mock_db_session,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.current_amount = None

        campaign_service_instance.increment_amount(
            db=mock_db_session,
            campaign=sample_campaign,
            amount=Decimal("100.00")
        )

        assert sample_campaign.current_amount == Decimal("100.00")
        mock_db_session.flush.assert_called_once()

    def test_mark_completed_if_goal_reached_success(
        self,
        mock_db_session,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.current_amount = Decimal("1000.00")
        sample_campaign.target_amount = Decimal("1000.00")
        sample_campaign.status = CampaignStatus.ACTIVE

        result = campaign_service_instance.mark_completed_if_goal_reached(
            db=mock_db_session,
            campaign=sample_campaign
        )

        assert result is True
        assert sample_campaign.status == CampaignStatus.COMPLETED
        mock_db_session.flush.assert_called_once()

    def test_mark_completed_if_goal_not_reached(
        self,
        mock_db_session,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.current_amount = Decimal("500.00")
        sample_campaign.target_amount = Decimal("1000.00")
        sample_campaign.status = CampaignStatus.ACTIVE

        result = campaign_service_instance.mark_completed_if_goal_reached(
            db=mock_db_session,
            campaign=sample_campaign
        )

        assert result is False
        assert sample_campaign.status == CampaignStatus.ACTIVE
        mock_db_session.flush.assert_not_called()

    def test_mark_completed_if_goal_exceeded(
        self,
        mock_db_session,
        sample_campaign,
        campaign_service_instance
    ):
        sample_campaign.current_amount = Decimal("1200.00")
        sample_campaign.target_amount = Decimal("1000.00")
        sample_campaign.status = CampaignStatus.ACTIVE

        result = campaign_service_instance.mark_completed_if_goal_reached(
            db=mock_db_session,
            campaign=sample_campaign
        )

        assert result is True
        assert sample_campaign.status == CampaignStatus.COMPLETED
        mock_db_session.flush.assert_called_once()

    def test_get_campaign_success(
        self,
        mock_db_session,
        sample_campaign,
        campaign_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = sample_campaign

        result = campaign_service_instance.get_campaign(
            db=mock_db_session,
            campaign_id=1
        )

        assert result == sample_campaign

    def test_get_campaign_not_found(
        self,
        mock_db_session,
        campaign_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None

        with pytest.raises(CampaignNotFoundError):
            campaign_service_instance.get_campaign(
                db=mock_db_session,
                campaign_id=1
            )
