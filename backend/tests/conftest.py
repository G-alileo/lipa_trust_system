from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, Mock

import pytest

from domain.enums import CampaignStatus, ContributionStatus, TransactionStatus
from modules.campaigns.models import Campaign
from modules.contributions.models import Contribution
from modules.refunds.models import Refund
from modules.users.models import User
from modules.campaigns.service import CampaignService
from modules.contributions.service import ContributionService
from modules.ledger.service import LedgerService
from modules.refunds.service import RefundService
from modules.campaigns.surplus_service import SurplusService
from modules.admin.monitoring_service import MonitoringService
from modules.admin.refund_approval_service import RefundApprovalService
from modules.admin.surplus_admin_service import SurplusAdminService
from modules.admin.verification_service import VerificationService
from modules.system.models import FailedTransaction
from modules.disbursements.models import Disbursement
from modules.payments.mpesa_client import PaymentService, STKPushResponse, B2CResponse


@pytest.fixture
def mock_db_session():
    session = MagicMock()
    session.add = Mock()
    session.commit = Mock()
    session.rollback = Mock()
    session.flush = Mock()
    session.query = Mock()
    return session


@pytest.fixture
def sample_user():
    user = User(
        id=1,
        phone_number="254712345678",
        email="test@example.com",
        hashed_password="hashed_password_here",
        is_active=True,
        is_admin=False,
        created_at=datetime.utcnow()
    )
    return user


@pytest.fixture
def sample_campaign():
    campaign = Campaign(
        id=1,
        owner_id=1,
        title="Test Campaign",
        description="Test Description",
        target_amount=Decimal("1000.00"),
        current_amount=Decimal("500.00"),
        status=CampaignStatus.ACTIVE,
        deadline=datetime.utcnow() + timedelta(days=7),
        paybill_number="123456",
        account_reference="TEST001",
        is_verified=True,
        created_at=datetime.utcnow()
    )
    return campaign


@pytest.fixture
def sample_contribution():
    contribution = Contribution(
        id=1,
        campaign_id=1,
        user_id=1,
        amount=Decimal("100.00"),
        status=ContributionStatus.COMPLETED,
        created_at=datetime.utcnow()
    )
    return contribution


@pytest.fixture
def sample_refund():
    refund = Refund(
        id=1,
        contribution_id=1,
        amount=Decimal("100.00"),
        status=TransactionStatus.PENDING,
        attempts=0,
        raw_payload=None,
        created_at=datetime.utcnow()
    )
    return refund


@pytest.fixture
def campaign_service_instance():
    return CampaignService()


@pytest.fixture
def contribution_service_instance():
    return ContributionService()


@pytest.fixture
def ledger_service_instance():
    return LedgerService()


@pytest.fixture
def refund_service_instance():
    return RefundService()


@pytest.fixture
def surplus_service_instance():
    return SurplusService()


@pytest.fixture
def sample_failed_transaction():
    failed_transaction = FailedTransaction(
        id=1,
        reference_type="CONTRIBUTION",
        reference_id="1",
        reason="Payment gateway timeout",
        payload={"error": "timeout"},
        created_at=datetime.utcnow()
    )
    return failed_transaction


@pytest.fixture
def sample_disbursement():
    disbursement = Disbursement(
        id=1,
        campaign_id=1,
        amount=Decimal("1000.00"),
        status=TransactionStatus.PENDING,
        created_at=datetime.utcnow()
    )
    return disbursement


@pytest.fixture
def sample_admin_user():
    admin = User(
        id=999,
        phone_number="254700000000",
        email="admin@example.com",
        hashed_password="hashed_admin_password",
        is_active=True,
        is_admin=True,
        created_at=datetime.utcnow()
    )
    return admin


@pytest.fixture
def monitoring_service_instance():
    return MonitoringService()


@pytest.fixture
def refund_approval_service_instance():
    return RefundApprovalService()


@pytest.fixture
def surplus_admin_service_instance():
    return SurplusAdminService()


@pytest.fixture
def verification_service_instance():
    return VerificationService()


@pytest.fixture
def mock_payment_service(mocker):
    mock_service = mocker.Mock(spec=PaymentService)
    mock_service.initiate_stk_push.return_value = STKPushResponse(
        checkout_request_id="ws_CO_TEST123",
        merchant_request_id="mrq_TEST123",
        response_code="0",
        response_description="Success",
        customer_message="Success"
    )
    mock_service.initiate_b2c_refund.return_value = B2CResponse(
        conversation_id="AG_TEST123",
        originator_conversation_id="org_TEST123",
        response_code="0",
        response_description="Success",
        success=True
    )
    mock_service.verify_callback_payload.return_value = True
    return mock_service
