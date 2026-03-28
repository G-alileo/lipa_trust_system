# Lipa Trust System

A crowdfunding platform with M-Pesa integration, built with FastAPI and SQLAlchemy.

## Setup

1. **Install dependencies**
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv sync
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and M-Pesa credentials
   ```

3. **Initialize database**
   ```bash
   uv run python create_tables.py
   ```

4. **Run server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

API documentation available at `http://localhost:8000/docs`

## Project Structure

```
lipa_trust_system/
├── api/                    # FastAPI routes and dependencies
│   ├── routes/            # API endpoints
│   └── deps.py           # Authentication dependencies
├── core/                  # Configuration and database setup
├── modules/               # Business logic modules
│   ├── admin/            # Admin services
│   ├── campaigns/        # Campaign operations
│   ├── contributions/    # M-Pesa payment processing
│   ├── disbursements/    # Payment disbursements
│   ├── ledger/           # Accounting system
│   ├── payments/         # Payment processing
│   ├── refunds/          # Refund handling
│   ├── system/           # System utilities
│   ├── users/            # User management
│   └── vouches/          # Trust/vouch system
├── schemas/               # Pydantic request/response models
├── domain/                # Enums and domain objects
├── workers/               # Background tasks
└── tests/                 # Unit tests
```

## Authentication

The system supports role-based authentication with JWT tokens. Users can register as either `user` or `admin` role. Admin users have access to campaign verification, refund management, and system monitoring endpoints.

## Testing

Import `postman_collection.json` into Postman for comprehensive API testing with automated token management.