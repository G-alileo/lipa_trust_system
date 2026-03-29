from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import Mock

import pytest

from domain.enums import CampaignStatus, ContributionStatus
from modules.contributions.service import ContributionService, ContributionError


class TestContributionService:

    def test_initiate_contribution_success(
        self,
        mock_db_session,
        sample_campaign,
        sample_user,
        contribution_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.deadline = datetime.utcnow() + timedelta(days=7)

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        result = contribution_service_instance.initiate_contribution(
            db=mock_db_session,
            user_id=1,
            campaign_id=1,
            amount=Decimal("100.00"),
            phone_number="254712345678"
        )

        assert result.status == ContributionStatus.PENDING
        mock_db_session.add.assert_called_once()
        mock_db_session.commit.assert_called_once()

    def test_initiate_contribution_campaign_locked(
        self,
        mock_db_session,
        sample_campaign,
        contribution_service_instance
    ):
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.deadline = datetime.utcnow() + timedelta(days=7)

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        contribution_service_instance.initiate_contribution(
            db=mock_db_session,
            user_id=1,
            campaign_id=1,
            amount=Decimal("100.00"),
            phone_number="254712345678"
        )

        mock_with_for_update.first.assert_called_once()

    def test_initiate_contribution_campaign_inactive(
        self,
        mock_db_session,
        sample_campaign,
        contribution_service_instance
    ):
        sample_campaign.status = CampaignStatus.PAUSED
        sample_campaign.deadline = datetime.utcnow() + timedelta(days=7)

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        with pytest.raises(Exception):
            contribution_service_instance.initiate_contribution(
                db=mock_db_session,
                user_id=1,
                campaign_id=1,
                amount=Decimal("100.00"),
                phone_number="254712345678"
            )

    def test_initiate_contribution_target_reached(
        self,
        mock_db_session,
        sample_campaign,
        contribution_service_instance
    ):
        sample_campaign.status = CampaignStatus.COMPLETED
        sample_campaign.deadline = datetime.utcnow() + timedelta(days=7)

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_campaign

        with pytest.raises(Exception):
            contribution_service_instance.initiate_contribution(
                db=mock_db_session,
                user_id=1,
                campaign_id=1,
                amount=Decimal("100.00"),
                phone_number="254712345678"
            )

    def test_get_contributions_by_user(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_order_by = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order_by
        mock_order_by.all.return_value = [sample_contribution]

        result = contribution_service_instance.get_contributions_by_user(
            db=mock_db_session,
            user_id=1
        )

        assert len(result) == 1
        assert result[0].id == sample_contribution.id

    def test_get_contributions_by_campaign(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()
        mock_order_by = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order_by
        mock_order_by.all.return_value = [sample_contribution]

        result = contribution_service_instance.get_contributions_by_campaign(
            db=mock_db_session,
            campaign_id=1
        )

        assert len(result) == 1
        assert result[0].campaign_id == 1

    def test_handle_callback_success(
        self,
        mock_db_session,
        sample_campaign,
        sample_contribution,
        contribution_service_instance,
        mocker
    ):
        sample_contribution.status = ContributionStatus.PENDING
        sample_contribution.checkout_request_id = "ws_CO_TEST123"
        sample_campaign.status = CampaignStatus.ACTIVE
        sample_campaign.current_amount = Decimal("500.00")

        payload = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "mrq_TEST123",
                    "CheckoutRequestID": "ws_CO_TEST123",
                    "ResultCode": 0,
                    "ResultDesc": "Success",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "Amount", "Value": 100.00},
                            {"Name": "MpesaReceiptNumber", "Value": "MPX123ABC"},
                            {"Name": "PhoneNumber", "Value": "254712345678"}
                        ]
                    }
                }
            }
        }

        mock_payment_service = mocker.Mock()
        mock_payment_service.verify_callback_payload.return_value = True
        mock_payment_service.extract_callback_data.return_value = {
            "checkout_request_id": "ws_CO_TEST123",
            "mpesa_receipt": "MPX123ABC",
            "amount": Decimal("100.00"),
            "success": True,
            "result_desc": "Success"
        }
        contribution_service_instance.payment_service = mock_payment_service

        mock_campaign_service = mocker.Mock()
        mock_campaign_service.get_campaign_for_update.return_value = sample_campaign
        mock_campaign_service.increment_amount.return_value = None
        mock_campaign_service.mark_completed_if_goal_reached.return_value = None
        contribution_service_instance.campaign_service = mock_campaign_service

        mock_ledger_service = mocker.Mock()
        mock_ledger_service.create_entry.return_value = None
        contribution_service_instance.ledger_service = mock_ledger_service

        def query_side_effect(model):
            mock_query = Mock()
            mock_filter = Mock()
            mock_with_for_update = Mock()

            if model.__name__ == "Contribution":
                mock_query.filter.return_value = mock_filter
                mock_filter.first.return_value = None
                mock_filter.with_for_update.return_value = mock_with_for_update
                mock_with_for_update.first.return_value = sample_contribution
                return mock_query
            elif model.__name__ == "Campaign":
                mock_query.filter.return_value = mock_filter
                mock_filter.with_for_update.return_value = mock_with_for_update
                mock_with_for_update.first.return_value = sample_campaign
                return mock_query

        mock_db_session.query.side_effect = query_side_effect

        result = contribution_service_instance.handle_payment_callback(
            db=mock_db_session,
            payload=payload
        )

        assert result.status == ContributionStatus.COMPLETED
        assert result.mpesa_receipt == "MPX123ABC"
        mock_db_session.commit.assert_called()

    def test_handle_callback_duplicate_receipt(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        sample_contribution.mpesa_receipt = "MPX123ABC"

        payload = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "mrq_TEST123",
                    "CheckoutRequestID": "ws_CO_TEST123",
                    "ResultCode": 0,
                    "ResultDesc": "Success",
                    "CallbackMetadata": {
                        "Item": [
                            {"Name": "MpesaReceiptNumber", "Value": "MPX123ABC"}
                        ]
                    }
                }
            }
        }

        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = sample_contribution

        result = contribution_service_instance.handle_payment_callback(
            db=mock_db_session,
            payload=payload
        )

        assert result == sample_contribution
        mock_db_session.commit.assert_not_called()

    def test_handle_callback_payment_failed(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        sample_contribution.status = ContributionStatus.PENDING
        sample_contribution.checkout_request_id = "ws_CO_TEST123"

        payload = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "mrq_TEST123",
                    "CheckoutRequestID": "ws_CO_TEST123",
                    "ResultCode": 1,
                    "ResultDesc": "User cancelled transaction"
                }
            }
        }

        def query_side_effect(model):
            mock_query = Mock()
            mock_filter = Mock()
            mock_with_for_update = Mock()

            if model.__name__ == "Contribution":
                mock_query.filter.return_value = mock_filter

                def first_side_effect():
                    if hasattr(mock_filter, 'with_for_update_called'):
                        return sample_contribution
                    return None

                mock_filter.first.side_effect = first_side_effect
                mock_filter.with_for_update.return_value = mock_with_for_update
                mock_filter.with_for_update_called = True
                mock_with_for_update.first.return_value = sample_contribution
                return mock_query

        mock_db_session.query.side_effect = query_side_effect

        result = contribution_service_instance.handle_payment_callback(
            db=mock_db_session,
            payload=payload
        )

        assert result.status == ContributionStatus.FAILED
        mock_db_session.add.assert_called()
        mock_db_session.commit.assert_called()

    def test_handle_callback_contribution_not_found(
        self,
        mock_db_session,
        contribution_service_instance
    ):
        payload = {
            "Body": {
                "stkCallback": {
                    "MerchantRequestID": "mrq_TEST123",
                    "CheckoutRequestID": "ws_CO_NOTFOUND",
                    "ResultCode": 0,
                    "ResultDesc": "Success"
                }
            }
        }

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        result = contribution_service_instance.handle_payment_callback(
            db=mock_db_session,
            payload=payload
        )

        assert result is None
        mock_db_session.add.assert_called()
        mock_db_session.commit.assert_called()

    def test_get_contribution_success(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = sample_contribution

        result = contribution_service_instance.get_contribution(mock_db_session, 1)

        assert result.id == sample_contribution.id
        assert result.amount == sample_contribution.amount

    def test_get_contribution_not_found(
        self,
        mock_db_session,
        contribution_service_instance
    ):
        from modules.contributions.service import ContributionNotFoundError

        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None

        with pytest.raises(ContributionNotFoundError):
            contribution_service_instance.get_contribution(mock_db_session, 999)

    def test_get_contribution_by_checkout_id_success(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        sample_contribution.checkout_request_id = "ws_CO_TEST123"

        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = sample_contribution

        result = contribution_service_instance.get_contribution_by_checkout_id(
            mock_db_session,
            "ws_CO_TEST123"
        )

        assert result is not None
        assert result.checkout_request_id == "ws_CO_TEST123"

    def test_get_contribution_by_checkout_id_not_found(
        self,
        mock_db_session,
        contribution_service_instance
    ):
        mock_query = Mock()
        mock_filter = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None

        result = contribution_service_instance.get_contribution_by_checkout_id(
            mock_db_session,
            "ws_CO_NOTFOUND"
        )

        assert result is None

    def test_get_contributions_by_user_with_status_filter(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        sample_contribution.status = ContributionStatus.COMPLETED

        mock_query = Mock()
        mock_filter_user = Mock()
        mock_filter_status = Mock()
        mock_order_by = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter_user
        mock_filter_user.filter.return_value = mock_filter_status
        mock_filter_status.order_by.return_value = mock_order_by
        mock_order_by.all.return_value = [sample_contribution]

        result = contribution_service_instance.get_contributions_by_user(
            db=mock_db_session,
            user_id=1,
            status=ContributionStatus.COMPLETED
        )

        assert len(result) == 1
        assert result[0].status == ContributionStatus.COMPLETED

    def test_get_contributions_by_campaign_with_status_filter(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        sample_contribution.status = ContributionStatus.PENDING

        mock_query = Mock()
        mock_filter_campaign = Mock()
        mock_filter_status = Mock()
        mock_order_by = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter_campaign
        mock_filter_campaign.filter.return_value = mock_filter_status
        mock_filter_status.order_by.return_value = mock_order_by
        mock_order_by.all.return_value = [sample_contribution]

        result = contribution_service_instance.get_contributions_by_campaign(
            db=mock_db_session,
            campaign_id=1,
            status=ContributionStatus.PENDING
        )

        assert len(result) == 1
        assert result[0].status == ContributionStatus.PENDING

    def test_reconcile_failed_payment_success(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        sample_contribution.status = ContributionStatus.FAILED

        mock_contrib_query = Mock()
        mock_contrib_filter = Mock()
        mock_contrib_with_for_update = Mock()

        mock_failed_query = Mock()
        mock_failed_filter = Mock()

        def query_side_effect(model):
            if model.__name__ == "Contribution":
                mock_contrib_query.filter.return_value = mock_contrib_filter
                mock_contrib_filter.with_for_update.return_value = mock_contrib_with_for_update
                mock_contrib_with_for_update.first.return_value = sample_contribution
                return mock_contrib_query
            elif model.__name__ == "FailedTransaction":
                mock_failed_query.filter.return_value = mock_failed_filter
                mock_failed_filter.all.return_value = []
                return mock_failed_query

        mock_db_session.query.side_effect = query_side_effect

        contribution_service_instance.reconcile_failed_payment(mock_db_session, 1)

        mock_db_session.commit.assert_called()

    def test_reconcile_failed_payment_not_found(
        self,
        mock_db_session,
        contribution_service_instance
    ):
        from modules.contributions.service import ContributionNotFoundError

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = None

        with pytest.raises(ContributionNotFoundError):
            contribution_service_instance.reconcile_failed_payment(mock_db_session, 999)

    def test_reconcile_failed_payment_wrong_status(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance
    ):
        sample_contribution.status = ContributionStatus.COMPLETED

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_contribution

        contribution_service_instance.reconcile_failed_payment(mock_db_session, 1)

        mock_db_session.commit.assert_not_called()

    def test_handle_callback_already_completed(
        self,
        mock_db_session,
        sample_contribution,
        contribution_service_instance,
        mocker
    ):
        sample_contribution.status = ContributionStatus.COMPLETED
        sample_contribution.checkout_request_id = "ws_CO_TEST123"

        payload = {
            "Body": {
                "stkCallback": {
                    "CheckoutRequestID": "ws_CO_TEST123",
                    "ResultCode": 0,
                    "ResultDesc": "Success"
                }
            }
        }

        mock_payment_service = mocker.Mock()
        mock_payment_service.verify_callback_payload.return_value = True
        mock_payment_service.extract_callback_data.return_value = {
            "checkout_request_id": "ws_CO_TEST123",
            "success": True
        }
        contribution_service_instance.payment_service = mock_payment_service

        mock_query = Mock()
        mock_filter = Mock()
        mock_with_for_update = Mock()

        mock_db_session.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = None
        mock_filter.with_for_update.return_value = mock_with_for_update
        mock_with_for_update.first.return_value = sample_contribution

        result = contribution_service_instance.handle_payment_callback(
            db=mock_db_session,
            payload=payload
        )

        assert result.status == ContributionStatus.COMPLETED
        mock_db_session.commit.assert_not_called()

