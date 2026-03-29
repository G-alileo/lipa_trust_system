# LipaTrust

React frontend for LipaTrust product journeys.

## Pages

- `/` landing page (discover campaigns, open shared campaign links, contribute, start campaign)
- `/login`
- `/signup`

## Requirements

- Node.js 18+
- npm 9+
- Running backend API (default: `http://localhost:8000/api/v1`)

## Install and Run

```bash
cd ui
npm install
npm run dev
```

Build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Frontend Features

- Product-first campaign discovery and contribution flow
- Shareable campaign deep links: `/?campaign=<id>`
- Signup/login pages with redirect continuation (`next` param)
- Offline detection (`navigator.onLine`)
- Offline contribution queue stored in `localStorage`
- Automatic queued payment sync when back online and authenticated

## Backend Endpoints Used

Public endpoints:
- `GET /campaigns/public`
- `GET /campaigns/public/{campaign_id}`

Auth endpoints:
- `POST /auth/register`
- `POST /auth/login`

Authenticated user endpoints:
- `POST /campaigns/`
- `POST /contributions/initiate`

## Production Deployment

### Option A: Serve with Nginx (recommended)

1. Build static assets:
```bash
cd ui
npm ci
npm run build
```

2. Copy `dist/` to your server static path, for example:
- `/var/www/lipatrust-ui`

3. Nginx config example:

```nginx
server {
    listen 80;
    server_name app.your-domain.com;

    root /var/www/lipatrust-ui;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

4. Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Option B: Vite preview (non-production fallback)

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Use a reverse proxy in front of it for TLS and domain routing.

## Configuration Notes

- API base is currently set in `src/App.jsx` as:
  - `http://localhost:8000/api/v1`
- For production, update this constant or inject runtime env handling before build.
