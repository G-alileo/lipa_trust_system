from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserCreate(BaseModel):
    phone_number: str = Field(..., min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8)
    role: UserRole = Field(default=UserRole.USER, description="User role: 'user' or 'admin'")


class UserLogin(BaseModel):
    phone_number: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(default=1800, description="Access token expiry in seconds")


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(default=1800, description="Access token expiry in seconds")


class UserResponse(BaseModel):
    id: int
    phone_number: str
    email: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True
