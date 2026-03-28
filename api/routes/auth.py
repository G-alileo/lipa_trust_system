from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.deps import get_db
from core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_refresh_token
from modules.users.models import User
from schemas.auth import UserCreate, UserLogin, TokenResponse, UserResponse, RefreshTokenRequest, AccessTokenResponse, UserRole
from schemas.base import APIResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[UserResponse])
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )

    # Set admin status based on role selection
    is_admin = payload.role == UserRole.ADMIN

    user = User(
        phone_number=payload.phone_number,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
        is_admin=is_admin
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return APIResponse.ok(UserResponse.model_validate(user))


@router.post("/login", response_model=APIResponse[TokenResponse])
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == payload.phone_number).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return APIResponse.ok(TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    ))


@router.post("/refresh", response_model=APIResponse[AccessTokenResponse])
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh access token using a valid refresh token
    """
    # Decode and validate refresh token
    token_data = decode_refresh_token(payload.refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    user_id = token_data.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload"
        )

    # Verify user still exists and is active
    user = db.get(User, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return APIResponse.ok(AccessTokenResponse(access_token=access_token))
