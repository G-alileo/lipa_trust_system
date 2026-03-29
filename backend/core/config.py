from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=(".env", "backend/.env"))

    DATABASE_URL: str

    # JWT Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # M-Pesa / Daraja
    MPESA_MODE: str = "mock"  # mock | sandbox | production
    MPESA_BASE_URL: str = "https://sandbox.safaricom.co.ke"
    MPESA_CONSUMER_KEY: str = ""
    MPESA_CONSUMER_SECRET: str = ""
    MPESA_SHORTCODE: str = ""
    MPESA_PASSKEY: str = ""
    MPESA_CALLBACK_URL: str = ""
    MPESA_TIMEOUT_SECONDS: int = 30
    MPESA_SECURITY_CREDENTIAL: str = ""
    MPESA_B2C_INITIATOR_NAME: str = ""
    MPESA_B2B_INITIATOR_NAME: str = ""
    MPESA_B2C_COMMAND_ID: str = "BusinessPayment"
    MPESA_B2B_COMMAND_ID: str = "BusinessPayBill"
    MPESA_STATUS_COMMAND_ID: str = "TransactionStatusQuery"
    MPESA_RESULT_URL: str = ""
    MPESA_QUEUE_TIMEOUT_URL: str = ""

    # Frontend integration
    FRONTEND_ORIGINS: str = "*"


settings = Settings()
