import time
from datetime import timedelta

from core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token
)


class TestSecurity:

    def test_password_hashing(self):
        password = "test_password_123"

        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        assert hash1 != hash2
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)

    def test_password_verification_success(self):
        password = "secure_password"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_password_verification_failure(self):
        password = "secure_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_jwt_token_creation(self):
        data = {"user_id": 123, "email": "test@example.com"}

        token = create_access_token(data)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_jwt_token_decode(self):
        user_id = 456
        data = {"user_id": user_id}

        token = create_access_token(data)
        decoded = decode_access_token(token)

        assert decoded is not None
        assert decoded["user_id"] == user_id

    def test_jwt_token_with_custom_expiration(self):
        data = {"user_id": 789}
        expiration = timedelta(minutes=60)

        token = create_access_token(data, expires_delta=expiration)
        decoded = decode_access_token(token)

        assert decoded is not None
        assert decoded["user_id"] == 789
        assert "exp" in decoded

    def test_jwt_token_expiration(self):
        data = {"user_id": 999}
        expiration = timedelta(seconds=1)

        token = create_access_token(data, expires_delta=expiration)

        time.sleep(2)

        decoded = decode_access_token(token)
        assert decoded is None

    def test_jwt_invalid_token(self):
        invalid_token = "invalid.token.here"

        decoded = decode_access_token(invalid_token)

        assert decoded is None

    def test_jwt_token_contains_expiration(self):
        data = {"user_id": 111}

        token = create_access_token(data)
        decoded = decode_access_token(token)

        assert "exp" in decoded
        assert isinstance(decoded["exp"], int)

    def test_password_hash_different_each_time(self):
        password = "same_password"

        hashes = [get_password_hash(password) for _ in range(5)]

        assert len(set(hashes)) == 5

    def test_jwt_preserves_data_fields(self):
        data = {
            "user_id": 555,
            "email": "user@test.com",
            "is_admin": True,
            "roles": ["admin", "user"]
        }

        token = create_access_token(data)
        decoded = decode_access_token(token)

        assert decoded["user_id"] == 555
        assert decoded["email"] == "user@test.com"
        assert decoded["is_admin"] is True
        assert decoded["roles"] == ["admin", "user"]

    def test_empty_password_hashing(self):
        empty_password = ""
        hashed = get_password_hash(empty_password)

        assert hashed is not None
        assert verify_password(empty_password, hashed)

    def test_special_characters_in_password(self):
        password = "p@$$w0rd!#%&*"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed)
        assert not verify_password("password", hashed)
