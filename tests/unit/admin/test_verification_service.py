from decimal import Decimal
from unittest.mock import Mock

import pytest

from domain.enums import CampaignStatus
from modules.admin.verification_service import (
    VerificationService,
    CampaignNotFoundError,
    InvalidCampaignStatusError,
    VerificationError
)


class TestVerificationService:

    def test_verify_campaign_paybill_success(
        self,
        mock_db_session,
        sample_campaign,
        verification_service_instance
    ):
        sample_campaign.status = CampaignStatus.DRAFT
        sample_campaign.paybill_number = "123456"
        sample_campaign.is_verified = False

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        result = verification_service_instance.verify_campaign_paybill(
            db=mock_db_session,
            campaign_id=1,
            admin_id=999,
            notes="Verified successfully"
        )

        assert result.is_verified is True
        assert result.status == CampaignStatus.ACTIVE
        mock_db_session.add.assert_called()
        mock_db_session.commit.assert_called_once()

    def test_verify_campaign_paybill_campaign_not_found(
        self,
        mock_db_session,
        verification_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        with pytest.raises(CampaignNotFoundError):
            verification_service_instance.verify_campaign_paybill(
                db=mock_db_session,
                campaign_id=999,
                admin_id=1
            )

    def test_verify_campaign_paybill_wrong_status(
        self,
        mock_db_session,
        sample_campaign,
        verification_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.paybill_number = "123456"

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        with pytest.raises(InvalidCampaignStatusError):
            verification_service_instance.verify_campaign_paybill(
                db=mock_db_session,
                campaign_id=1,
                admin_id=999
            )

    def test_verify_campaign_paybill_no_paybill_number(
        self,
        mock_db_session,
        sample_campaign,
        verification_service_instance
    ):
        sample_campaign.status = CampaignStatus.DRAFT
        sample_campaign.paybill_number = None

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        with pytest.raises(VerificationError, match="has no paybill number"):
            verification_service_instance.verify_campaign_paybill(
                db=mock_db_session,
                campaign_id=1,
                admin_id=999
            )

    def test_reject_campaign_success(
        self,
        mock_db_session,
        sample_campaign,
        verification_service_instance
    ):
        sample_campaign.status = CampaignStatus.DRAFT

        def query_side_effect(model):
            mock_query = Mock()
            mock_filter = Mock()
            mock_with_for_update = Mock()

            if model.__name__ == "Campaign":
                mock_query.filter.return_value = mock_filter
                mock_filter.with_for_update.return_value = mock_with_for_update
                mock_with_for_update.first.return_value = sample_campaign
                return mock_query
            elif model.__name__ == "Contribution":
                mock_query.filter.return_value = mock_filter
                mock_filter.first.return_value = None
                return mock_query

        mock_db_session.query.side_effect = query_side_effect

        result = verification_service_instance.reject_campaign(
            db=mock_db_session,
            campaign_id=1,
            admin_id=999,
            reason="Invalid paybill"
        )

        assert result.status == CampaignStatus.FAILED
        mock_db_session.add.assert_called()
        mock_db_session.commit.assert_called_once()

    def test_reject_campaign_not_found(
        self,
        mock_db_session,
        verification_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        with pytest.raises(CampaignNotFoundError):
            verification_service_instance.reject_campaign(
                db=mock_db_session,
                campaign_id=999,
                admin_id=1,
                reason="Test"
            )

    def test_reject_campaign_wrong_status(
        self,
        mock_db_session,
        sample_campaign,
        verification_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        with pytest.raises(InvalidCampaignStatusError):
            verification_service_instance.reject_campaign(
                db=mock_db_session,
                campaign_id=1,
                admin_id=999,
                reason="Test"
            )

    def test_get_pending_campaigns(
        self,
        mock_db_session,
        sample_campaign,
        verification_service_instance
    ):
        sample_campaign.status = CampaignStatus.DRAFT

        mock_query = Mock()
        mock_filter = Mock()
        mock_order_by = Mock()
        mock_offset = Mock()
        mock_limit = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order_by
        mock_order_by.offset.return_value = mock_offset
        mock_offset.limit.return_value = mock_limit
        mock_limit.all.return_value = [sample_campaign]

        result = verification_service_instance.get_pending_campaigns(
            db=mock_db_session,
            limit=20,
            offset=0
        )

        assert len(result) == 1
        assert result[0].status == CampaignStatus.DRAFT

    def test_get_pending_count(
        self,
        mock_db_session,
        verification_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.count.return_value = 5

        result = verification_service_instance.get_pending_count(
            db=mock_db_session
        )

        assert result == 5
