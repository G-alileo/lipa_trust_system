import base64
import json
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any
from urllib import request, error

from core.config import settings


@dataclass
class STKPushRequest:
    phone_number: str
    amount: Decimal
    account_reference: str
    transaction_desc: str


@dataclass
class STKPushResponse:
    checkout_request_id: str
    merchant_request_id: str
    response_code: str
    response_description: str
    customer_message: str


@dataclass
class B2CResponse:
    conversation_id: str
    originator_conversation_id: str
    response_code: str
    response_description: str
    success: bool


@dataclass
class B2BResponse:
    conversation_id: str
    originator_conversation_id: str
    response_code: str
    response_description: str
    success: bool


class PaymentError(Exception):
    pass


class InvalidCallbackPayloadError(PaymentError):
    pass


class B2CError(PaymentError):
    pass


class PaymentService:
    _access_token: str | None = None
    _access_token_expires_at: datetime | None = None

    @classmethod
    def _is_mock_mode(cls) -> bool:
        return settings.MPESA_MODE.lower() == "mock"

    @staticmethod
    def _sanitize_phone_number(phone_number: str) -> str:
        cleaned = "".join(ch for ch in phone_number if ch.isdigit())
        if cleaned.startswith("0"):
            return f"254{cleaned[1:]}"
        if cleaned.startswith("7"):
            return f"254{cleaned}"
        return cleaned

    @classmethod
    def _base_url(cls) -> str:
        return settings.MPESA_BASE_URL.rstrip("/")

    @staticmethod
    def _to_mpesa_amount(amount: Decimal) -> int:
        decimal_amount = Decimal(amount)
        if decimal_amount <= 0:
            raise PaymentError("Amount must be greater than zero")
        return int(decimal_amount)

    @staticmethod
    def _require_setting(value: str, field_name: str) -> str:
        if not value:
            raise PaymentError(f"Missing {field_name}")
        return value

    @classmethod
    def _get_access_token(cls) -> str:
        now = datetime.now(timezone.utc)
        if cls._access_token and cls._access_token_expires_at and cls._access_token_expires_at > now:
            return cls._access_token

        if not settings.MPESA_CONSUMER_KEY or not settings.MPESA_CONSUMER_SECRET:
            raise PaymentError("Missing MPESA_CONSUMER_KEY/MPESA_CONSUMER_SECRET")

        credentials = f"{settings.MPESA_CONSUMER_KEY}:{settings.MPESA_CONSUMER_SECRET}"
        encoded_credentials = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
        token_url = f"{cls._base_url()}/oauth/v1/generate?grant_type=client_credentials"

        req = request.Request(token_url)
        req.add_header("Authorization", f"Basic {encoded_credentials}")

        try:
            with request.urlopen(req, timeout=settings.MPESA_TIMEOUT_SECONDS) as response:
                body = json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="ignore")
            raise PaymentError(f"Failed to fetch Daraja token: HTTP {exc.code} {details}") from exc
        except Exception as exc:
            raise PaymentError(f"Failed to fetch Daraja token: {exc}") from exc

        token = body.get("access_token")
        if not token:
            raise PaymentError(f"Invalid token response from Daraja: {body}")

        expires_in = int(body.get("expires_in", 3599))
        cls._access_token = token
        cls._access_token_expires_at = now + timedelta(seconds=max(expires_in - 60, 60))
        return token

    @classmethod
    def _daraja_post(cls, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        token = cls._get_access_token()
        url = f"{cls._base_url()}{path}"

        req = request.Request(
            url=url,
            method="POST",
            data=json.dumps(payload).encode("utf-8")
        )
        req.add_header("Authorization", f"Bearer {token}")
        req.add_header("Content-Type", "application/json")

        try:
            with request.urlopen(req, timeout=settings.MPESA_TIMEOUT_SECONDS) as response:
                return json.loads(response.read().decode("utf-8"))
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="ignore")
            raise PaymentError(
                f"Daraja request failed at {path}: HTTP {exc.code} {details}"
            ) from exc
        except Exception as exc:
            raise PaymentError(f"Daraja request failed at {path}: {exc}") from exc

    @staticmethod
    def initiate_stk_push(
        phone_number: str,
        amount: Decimal,
        account_reference: str,
        transaction_desc: str,
        paybill_number: str = None  # Now ignored for collection, using platform shortcode
    ) -> STKPushResponse:
        if PaymentService._is_mock_mode():
            checkout_request_id = f"ws_CO_{uuid.uuid4().hex[:20].upper()}"
            merchant_request_id = f"mrq_{uuid.uuid4().hex[:16].upper()}"

            return STKPushResponse(
                checkout_request_id=checkout_request_id,
                merchant_request_id=merchant_request_id,
                status="Success",
                response_code="0",
                response_description="Success. Request accepted for processing",
                customer_message="Success. Request accepted for processing"
            )

        # SECURITY FIX: Always use platform's primary collection shortcode
        # This ensures settings.MPESA_PASSKEY is always valid for this shortcode.
        shortcode = settings.MPESA_SHORTCODE
        if not shortcode:
            raise PaymentError("Missing MPESA_SHORTCODE for platform collection")
        
        PaymentService._require_setting(settings.MPESA_PASSKEY, "MPESA_PASSKEY")
        callback_url = PaymentService._require_setting(settings.MPESA_CALLBACK_URL, "MPESA_CALLBACK_URL")

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(
            f"{shortcode}{settings.MPESA_PASSKEY}{timestamp}".encode("utf-8")
        ).decode("utf-8")
        normalized_phone = PaymentService._sanitize_phone_number(phone_number)

        payload = {
            "BusinessShortCode": shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": PaymentService._to_mpesa_amount(amount),
            "PartyA": normalized_phone,
            "PartyB": shortcode,
            "PhoneNumber": normalized_phone,
            "CallBackURL": callback_url,
            "AccountReference": account_reference[:12] if account_reference else "LipaTrust",
            "TransactionDesc": transaction_desc[:182] if transaction_desc else "Contribution"
        }

        response = PaymentService._daraja_post("/mpesa/stkpush/v1/processrequest", payload)
        response_code = str(response.get("ResponseCode", ""))
        if response_code != "0":
            raise PaymentError(f"STK Push rejected by Daraja: {response}")

        checkout_request_id = str(response.get("CheckoutRequestID", ""))
        merchant_request_id = str(response.get("MerchantRequestID", ""))
        if not checkout_request_id or not merchant_request_id:
            raise PaymentError(f"Invalid STK response from Daraja: {response}")

        return STKPushResponse(
            checkout_request_id=checkout_request_id,
            merchant_request_id=merchant_request_id,
            response_code=response_code,
            response_description=str(response.get("ResponseDescription", "")),
            customer_message=str(response.get("CustomerMessage", ""))
        )

    @staticmethod
    def verify_callback_payload(payload: dict[str, Any]) -> bool:
        if not payload:
            raise InvalidCallbackPayloadError("Empty payload")

        body = payload.get("Body")
        if not body:
            raise InvalidCallbackPayloadError("Missing Body")

        stk_callback = body.get("stkCallback")
        if not stk_callback:
            raise InvalidCallbackPayloadError("Missing stkCallback")

        required_fields = {"MerchantRequestID", "CheckoutRequestID", "ResultCode", "ResultDesc"}
        missing_fields = required_fields - set(stk_callback.keys())

        if missing_fields:
            raise InvalidCallbackPayloadError(f"Missing fields: {missing_fields}")

        return True

    @staticmethod
    def extract_callback_data(payload: dict[str, Any]) -> dict[str, Any]:
        stk_callback = payload["Body"]["stkCallback"]
        result_code = str(stk_callback["ResultCode"])

        result = {
            "checkout_request_id": stk_callback["CheckoutRequestID"],
            "merchant_request_id": stk_callback["MerchantRequestID"],
            "result_code": result_code,
            "result_desc": stk_callback["ResultDesc"],
            "success": result_code == "0",
            "mpesa_receipt": None,
            "amount": None,
            "phone_number": None
        }

        if result["success"] and "CallbackMetadata" in stk_callback:
            metadata = stk_callback["CallbackMetadata"].get("Item", [])
            for item in metadata:
                name = item.get("Name")
                value = item.get("Value")
                if name == "MpesaReceiptNumber":
                    result["mpesa_receipt"] = value
                elif name == "Amount":
                    result["amount"] = Decimal(str(value))
                elif name == "PhoneNumber":
                    result["phone_number"] = str(value)

        return result

    @staticmethod
    def initiate_b2c_refund(
        phone_number: str,
        amount: Decimal,
        remarks: str = "Refund"
    ) -> B2CResponse:
        if not PaymentService._is_mock_mode():
            initiator_name = PaymentService._require_setting(
                settings.MPESA_B2C_INITIATOR_NAME,
                "MPESA_B2C_INITIATOR_NAME"
            )
            security_credential = PaymentService._require_setting(
                settings.MPESA_SECURITY_CREDENTIAL,
                "MPESA_SECURITY_CREDENTIAL"
            )
            shortcode = PaymentService._require_setting(settings.MPESA_SHORTCODE, "MPESA_SHORTCODE")
            result_url = PaymentService._require_setting(settings.MPESA_RESULT_URL, "MPESA_RESULT_URL")
            timeout_url = PaymentService._require_setting(
                settings.MPESA_QUEUE_TIMEOUT_URL,
                "MPESA_QUEUE_TIMEOUT_URL"
            )

            payload = {
                "InitiatorName": initiator_name,
                "SecurityCredential": security_credential,
                "CommandID": settings.MPESA_B2C_COMMAND_ID,
                "Amount": PaymentService._to_mpesa_amount(amount),
                "PartyA": shortcode,
                "PartyB": PaymentService._sanitize_phone_number(phone_number),
                "Remarks": remarks[:182],
                "QueueTimeOutURL": timeout_url,
                "ResultURL": result_url,
                "Occasion": "LipaTrustRefund"
            }

            try:
                response = PaymentService._daraja_post("/mpesa/b2c/v1/paymentrequest", payload)
            except PaymentError as exc:
                raise B2CError(str(exc)) from exc

            response_code = str(response.get("ResponseCode", ""))
            if response_code != "0":
                raise B2CError(f"B2C request rejected by Daraja: {response}")

            return B2CResponse(
                conversation_id=str(response.get("ConversationID", "")),
                originator_conversation_id=str(response.get("OriginatorConversationID", "")),
                response_code=response_code,
                response_description=str(response.get("ResponseDescription", "")),
                success=True
            )

        conversation_id = f"AG_{uuid.uuid4().hex[:20].upper()}"
        originator_id = f"org_{uuid.uuid4().hex[:16].upper()}"

        return B2CResponse(
            conversation_id=conversation_id,
            originator_conversation_id=originator_id,
            response_code="0",
            response_description="Accept the service request successfully.",
            success=True
        )

    @staticmethod
    def initiate_b2b_disbursement(
        receiver_shortcode: str,
        amount: Decimal,
        remarks: str = "Disbursement"
    ) -> B2BResponse:
        if not PaymentService._is_mock_mode():
            initiator_name = PaymentService._require_setting(
                settings.MPESA_B2B_INITIATOR_NAME,
                "MPESA_B2B_INITIATOR_NAME"
            )
            security_credential = PaymentService._require_setting(
                settings.MPESA_SECURITY_CREDENTIAL,
                "MPESA_SECURITY_CREDENTIAL"
            )
            sender_shortcode = PaymentService._require_setting(settings.MPESA_SHORTCODE, "MPESA_SHORTCODE")
            result_url = PaymentService._require_setting(settings.MPESA_RESULT_URL, "MPESA_RESULT_URL")
            timeout_url = PaymentService._require_setting(
                settings.MPESA_QUEUE_TIMEOUT_URL,
                "MPESA_QUEUE_TIMEOUT_URL"
            )

            payload = {
                "Initiator": initiator_name,
                "SecurityCredential": security_credential,
                "CommandID": settings.MPESA_B2B_COMMAND_ID,
                "SenderIdentifierType": "4",
                "RecieverIdentifierType": "4",
                "Amount": PaymentService._to_mpesa_amount(amount),
                "PartyA": sender_shortcode,
                "PartyB": receiver_shortcode,
                "AccountReference": "LipaTrust",
                "Remarks": remarks[:182],
                "QueueTimeOutURL": timeout_url,
                "ResultURL": result_url
            }

            try:
                response = PaymentService._daraja_post("/mpesa/b2b/v1/paymentrequest", payload)
            except PaymentError as exc:
                raise B2CError(str(exc)) from exc

            response_code = str(response.get("ResponseCode", ""))
            if response_code != "0":
                raise B2CError(f"B2B request rejected by Daraja: {response}")

            return B2BResponse(
                conversation_id=str(response.get("ConversationID", "")),
                originator_conversation_id=str(response.get("OriginatorConversationID", "")),
                response_code=response_code,
                response_description=str(response.get("ResponseDescription", "")),
                success=True
            )

        conversation_id = f"BG_{uuid.uuid4().hex[:20].upper()}"
        originator_id = f"org_{uuid.uuid4().hex[:16].upper()}"
        return B2BResponse(
            conversation_id=conversation_id,
            originator_conversation_id=originator_id,
            response_code="0",
            response_description="Accept the service request successfully.",
            success=True
        )

    @staticmethod
    def query_transaction_status(transaction_id: str) -> dict[str, Any]:
        if not PaymentService._is_mock_mode():
            initiator_name = settings.MPESA_B2C_INITIATOR_NAME or settings.MPESA_B2B_INITIATOR_NAME
            initiator_name = PaymentService._require_setting(initiator_name, "MPESA_B2C_INITIATOR_NAME|MPESA_B2B_INITIATOR_NAME")
            security_credential = PaymentService._require_setting(
                settings.MPESA_SECURITY_CREDENTIAL,
                "MPESA_SECURITY_CREDENTIAL"
            )
            shortcode = PaymentService._require_setting(settings.MPESA_SHORTCODE, "MPESA_SHORTCODE")
            result_url = PaymentService._require_setting(settings.MPESA_RESULT_URL, "MPESA_RESULT_URL")
            timeout_url = PaymentService._require_setting(
                settings.MPESA_QUEUE_TIMEOUT_URL,
                "MPESA_QUEUE_TIMEOUT_URL"
            )

            payload = {
                "Initiator": initiator_name,
                "SecurityCredential": security_credential,
                "CommandID": settings.MPESA_STATUS_COMMAND_ID,
                "TransactionID": transaction_id,
                "PartyA": shortcode,
                "IdentifierType": "4",
                "ResultURL": result_url,
                "QueueTimeOutURL": timeout_url,
                "Remarks": "LipaTrust status check",
                "Occasion": "LipaTrust"
            }

            response = PaymentService._daraja_post("/mpesa/transactionstatus/v1/query", payload)
            response_code = str(response.get("ResponseCode", "1"))
            return {
                "result_code": response_code,
                "result_desc": str(response.get("ResponseDescription", "")),
                "transaction_status": "Completed" if response_code == "0" else "Failed",
                "raw": response
            }

        return {
            "result_code": "0",
            "result_desc": "The service request is processed successfully.",
            "transaction_status": "Completed"
        }
