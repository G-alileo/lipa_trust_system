import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import Any


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


class PaymentError(Exception):
    pass


class InvalidCallbackPayloadError(PaymentError):
    pass


class B2CError(PaymentError):
    pass


class PaymentService:

    REQUIRED_CALLBACK_FIELDS = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID",
                "CheckoutRequestID",
                "ResultCode",
                "ResultDesc"
            }
        }
    }

    @staticmethod
    def initiate_stk_push(
        phone_number: str,
        amount: Decimal,
        account_reference: str,
        transaction_desc: str,
        paybill_number: str
    ) -> STKPushResponse:
        checkout_request_id = f"ws_CO_{uuid.uuid4().hex[:20].upper()}"
        merchant_request_id = f"mrq_{uuid.uuid4().hex[:16].upper()}"

        return STKPushResponse(
            checkout_request_id=checkout_request_id,
            merchant_request_id=merchant_request_id,
            response_code="0",
            response_description="Success. Request accepted for processing",
            customer_message="Success. Request accepted for processing"
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

        result = {
            "checkout_request_id": stk_callback["CheckoutRequestID"],
            "merchant_request_id": stk_callback["MerchantRequestID"],
            "result_code": stk_callback["ResultCode"],
            "result_desc": stk_callback["ResultDesc"],
            "success": stk_callback["ResultCode"] == 0,
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
    def query_transaction_status(transaction_id: str) -> dict[str, Any]:
        return {
            "result_code": "0",
            "result_desc": "The service request is processed successfully.",
            "transaction_status": "Completed"
        }
