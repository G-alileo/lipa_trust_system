# LipaTrust Backend

FastAPI backend for campaigns, contributions, auth, and M-Pesa Daraja integration.

## Runtime Requirements

- Python 3.11+
- MySQL 8+
- `uv` (recommended) or pip-compatible environment

## Python Dependencies

From `pyproject.toml`:
- `fastapi`
- `uvicorn`
- `sqlalchemy`
- `pymysql`
- `pydantic-settings`
- `python-jose[cryptography]`
- `passlib[bcrypt]`
- `bcrypt`
- `email-validator`

## Environment Variables

Copy and edit:

```bash
cp .env.example .env
```

Required core variables:
- `DATABASE_URL`
- `SECRET_KEY`

Daraja sandbox variables:
- `MPESA_MODE=sandbox`
- `MPESA_BASE_URL=https://sandbox.safaricom.co.ke`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL`
- `MPESA_SECURITY_CREDENTIAL`
- `MPESA_B2C_INITIATOR_NAME`
- `MPESA_B2B_INITIATOR_NAME`
- `MPESA_RESULT_URL`
- `MPESA_QUEUE_TIMEOUT_URL`

CORS/UI variable:
- `FRONTEND_ORIGINS` (comma-separated origins)

## Local Run

```bash
cd backend
uv venv
source .venv/bin/activate
uv sync
uv run python create_tables.py
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Docs:
- `http://localhost:8000/docs`

## API Groups

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/campaigns/public`
- `GET /api/v1/campaigns/public/{campaign_id}`
- `POST /api/v1/campaigns/`
- `GET /api/v1/campaigns/`
- `GET /api/v1/campaigns/my`
- `POST /api/v1/contributions/initiate`
- `POST /api/v1/contributions/callback/mpesa`
- `POST /api/v1/mpesa/result`
- `POST /api/v1/mpesa/timeout`

Admin API groups (role-protected):
- `/api/v1/admin/campaigns/*`
- `/api/v1/admin/refunds/*`
- `/api/v1/admin/surplus/*`
- `/api/v1/admin/monitoring/*`

## Background Workers

Current workers are Python modules under `workers/`:
- `campaign_worker.py`
- `refund_worker.py`
- `disbursement_worker.py`
- `retry_worker.py`
- `reconciliation_worker.py`

Run strategy in production:
- execute workers via cron, supervisor, or a process manager at controlled intervals.

## Production Deployment (Linux VM)

### 1) Install system deps

```bash
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv nginx
```

### 2) Deploy app

```bash
cd /opt
sudo git clone <your-repo-url> lipa_trust_system
cd lipa_trust_system/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install uv
uv sync
cp .env.example .env
# edit .env with production values
```

### 3) Database init/migrations

```bash
source .venv/bin/activate
python create_tables.py
```

### 4) Systemd service (Uvicorn)

Create `/etc/systemd/system/lipatrust-backend.service`:

```ini
[Unit]
Description=LipaTrust Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/lipa_trust_system/backend
Environment="PATH=/opt/lipa_trust_system/backend/.venv/bin"
ExecStart=/opt/lipa_trust_system/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable lipatrust-backend
sudo systemctl start lipatrust-backend
sudo systemctl status lipatrust-backend
```

### 5) Nginx reverse proxy

Create `/etc/nginx/sites-available/lipatrust-backend`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/lipatrust-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Then add TLS (Certbot or your cloud LB).

## Operational Notes

- For public callback URLs, ensure HTTPS and stable domain.
- Keep `MPESA_MODE=mock` in non-payment test environments.
- Rotate `SECRET_KEY` and Daraja credentials securely.
- Monitor `failed_transactions` for reconciliation.
