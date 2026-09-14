# Deployment Guide

For local development setup, see [README.md](README.md) — this document
covers running SmartCity Connect on a real server for other people to use.

This app has no cloud-specific dependencies, so these steps apply to any
Linux VPS (DigitalOcean, EC2, a home server, etc.). Adjust paths/commands as
needed for your OS.

## Before you deploy — security checklist

This codebase was built iteratively during development with several things
intentionally relaxed for local testing. **Do not deploy without addressing
these:**

- [ ] **Generate a fresh `SECRET_KEY`** — never reuse a value that was ever
      committed to git or used in development.
      `python -c "import secrets; print(secrets.token_hex(32))"`
- [ ] **`backend/.env` must never be committed.** Confirm it's covered by
      `.gitignore` (it is, by default) and double-check nothing named `env`,
      `.env.bak`, etc. sits alongside it uncommitted-but-untracked-badly.
- [ ] **Lock down CORS.** `app/main.py` currently allows `allow_origins=[...,
      "*"]` alongside `allow_credentials=True` — replace the wildcard with
      your actual frontend domain(s) only.
- [ ] **Consider replacing SQLite.** SQLite works fine for development and
      light traffic, but doesn't handle concurrent writes well under real
      load. For production traffic, migrate to PostgreSQL (see
      [Database](#database) below).
- [ ] **Review bypassed authorization checks.** A few endpoints had RBAC
      checks disabled during development for testing (search the backend for
      comments like `TEMPORARILY BYPASSED` / `TEMPORARILY RELAXED`). Confirm
      these are re-enabled before exposing the API publicly.
- [ ] **Rotate the SMTP credentials** in `app/services/email_service.py` if
      you plan to send real emails — don't hardcode them; move to `.env`
      like `SECRET_KEY`.

## Architecture

```
                        ┌─────────────────────┐
  Browser  ───HTTPS───▶ │  Nginx (reverse      │
                        │  proxy + static      │
                        │  file server)         │
                        └──────────┬───────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  │                                  │
          serves frontend/dist          proxies /api, /complaints,
          (static files)                /department, /worker
                                                  │
                                                  ▼
                                    ┌───────────────────────┐
                                    │  Uvicorn (FastAPI)     │
                                    │  127.0.0.1:8000        │
                                    │  managed by systemd    │
                                    └───────────┬───────────┘
                                                  │
                                                  ▼
                                    ┌───────────────────────┐
                                    │  SQLite / PostgreSQL   │
                                    └───────────────────────┘
```

The frontend is built to static files and served directly by Nginx —
there's no Node process running in production. The backend runs as a
long-lived Uvicorn process behind Nginx, reachable only on localhost.

## 1. Server prerequisites

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx git
```

Install Node.js (needed only to *build* the frontend, not to run it) — e.g.
via [nvm](https://github.com/nvm-sh/nvm), or your distro's package manager
for Node 18+.

## 2. Get the code

```bash
sudo mkdir -p /opt/smart-city
sudo chown $USER:$USER /opt/smart-city
git clone https://github.com/shahid-khaleel/smart-city.git /opt/smart-city
cd /opt/smart-city
```

## 3. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cp .env.example .env
```

Edit `.env`:
- Set a freshly generated `SECRET_KEY` (see the checklist above).
- Set `DATABASE_URL` — keep the SQLite default for a small/single-server
  deployment, or point it at PostgreSQL (see [Database](#database)).
- Leave `HF_TOKEN` blank unless you specifically want the hosted
  severity-scoring call — everything else works without it.

Seed the database (only once — **this wipes any existing data**, so skip
this step entirely on a redeploy):

```bash
python seed.py
```

Immediately change the seeded test account passwords (`admin@smartcity.com`
etc. all default to `password123`) or remove them before going live.

### Run the backend as a service

Create `/etc/systemd/system/smartcity-backend.service`:

```ini
[Unit]
Description=SmartCity Connect backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/smart-city/backend
Environment="PATH=/opt/smart-city/backend/venv/bin"
ExecStart=/opt/smart-city/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /opt/smart-city/backend
sudo systemctl daemon-reload
sudo systemctl enable --now smartcity-backend
sudo systemctl status smartcity-backend
```

`--workers 2` runs multiple Uvicorn worker processes — note the local AI
models (~1.7 GB) load into memory **per worker**, so size this to your
server's available RAM (1 worker is fine for low traffic).

## 4. Frontend

Build static files (from your own machine or the server — either works,
Node is only needed at build time):

```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

This produces `frontend/dist/` — the files Nginx will serve directly.

## 5. Nginx

Create `/etc/nginx/sites-available/smartcity`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /opt/smart-city/frontend/dist;
    index index.html;

    # React Router - serve index.html for any unmatched route
    location / {
        try_files $uri /index.html;
    }

    # Proxy every backend route to Uvicorn
    location ~ ^/(api|complaints|department|worker|admin|docs|openapi.json) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/smartcity /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Update `app/main.py`'s CORS `allow_origins` to your actual domain (not
`localhost:5173`) once the frontend is served from Nginx instead of Vite's
dev server.

### HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Certbot rewrites the Nginx config to redirect HTTP → HTTPS and auto-renews.

## 6. Firewall

```bash
sudo ufw allow 'Nginx Full'   # 80 + 443
sudo ufw allow OpenSSH
sudo ufw enable
```

Port 8000 (the backend) should **not** be opened externally — Nginx is the
only thing that talks to it, over localhost.

## Database

The default SQLite setup works as-is for small deployments — no extra
service to run, the whole database is one file
(`backend/smartcity.db`, already excluded from git).

To move to PostgreSQL for higher-traffic deployments:

```bash
sudo apt install -y postgresql
sudo -u postgres createuser smartcity
sudo -u postgres createdb smartcity_db -O smartcity
sudo -u postgres psql -c "ALTER USER smartcity WITH PASSWORD 'choose-a-password';"
```

```bash
pip install psycopg2-binary
```

Update `.env`:
```
DATABASE_URL=postgresql://smartcity:choose-a-password@localhost/smartcity_db
```

Restart the backend service — SQLAlchemy creates the tables automatically
on startup (`Base.metadata.create_all` in `app/main.py`), same as SQLite.
Run `python seed.py` once against the new database if you want the sample
data (note: it still does a full drop/recreate, same caveat as before).

## Redeploying after code changes

```bash
cd /opt/smart-city
git pull

# Backend (only if dependencies changed)
cd backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart smartcity-backend

# Frontend
cd ../frontend && npm install --legacy-peer-deps && npm run build
# (no restart needed - Nginx serves the new dist/ files immediately)
```

## Logs & troubleshooting

```bash
# Backend logs
sudo journalctl -u smartcity-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

See [README.md](README.md#troubleshooting) for common setup issues
(OpenCV DLL errors, Unicode crashes on Windows dev machines, etc.) — those
apply to building/testing locally before you deploy, not to the server
itself (a Linux server won't hit the Windows-specific ones).
