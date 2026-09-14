# SmartCity Connect

A civic issue reporting platform. Citizens report problems (potholes, broken
streetlights, water leaks, etc.) with a photo and location; the system
auto-categorizes and routes them to the right municipal department; officials
dispatch field workers; workers resolve and submit proof of completion.

- **Backend:** FastAPI + SQLAlchemy (SQLite), JWT auth, local AI (zero-shot
  text classification via `transformers`, image blur detection via OpenCV,
  duplicate-report detection via sentence embeddings)

> This document covers running the app locally for development. For
> deploying it on a real server, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.
- **Frontend:** React 18 + Vite + Tailwind CSS, Leaflet maps

## Roles

| Role | What they do |
|---|---|
| Citizen | Report issues, track their own reports |
| Official (Department) | View all reports, dispatch a field worker |
| Worker (Field Worker) | View assigned tasks, resolve with notes + proof photo |
| Admin | City-wide overview, approve/deny profile-edit requests |

## Prerequisites

- **Python 3.10+** (tested on 3.14)
- **Node.js 18+** and npm (tested on Node 24 / npm 11)
- Git

No external database is required — this project uses SQLite, stored as a
local file (`backend/smartcity.db`).

## 1. Clone and configure

```bash
git clone https://github.com/shahid-khaleel/smart-city.git
cd smart-city
```

### Backend environment

```bash
cd backend
cp .env.example .env        # PowerShell: copy .env.example .env
```

Open `.env` and set a real `SECRET_KEY` (this signs login tokens — never
reuse the example value):

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Paste the output as `SECRET_KEY=...` in `.env`. Everything else in
`.env.example` has a working default:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Defaults to a local SQLite file, no setup needed |
| `SECRET_KEY` | Yes | Generate your own — see above |
| `ALGORITHM` | Yes | Leave as `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | Login session length in minutes |
| `HF_TOKEN` | No | Only needed for the *hosted* severity-scoring call in `app/services/ai_service.py`. Leave blank — the app falls back to `"Medium"` severity, and the local AI features (category detection, blur/duplicate detection) don't need this at all. Get one at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) if you want it. |

## 2. Backend setup

```bash
cd backend
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate            # Windows
source venv/bin/activate         # macOS / Linux

pip install --upgrade pip
pip install -r requirements.txt
```

This installs FastAPI plus the local AI stack (`torch`, `transformers`,
`sentence-transformers`, `opencv-python-headless`) — it's a large install
(~2-3 GB) and can take several minutes on first run.

### Seed the database

```bash
python seed.py
```

This creates all tables, seeds 6 departments, 1 municipality, and 4 test
accounts (see [Test accounts](#test-accounts) below), plus a few sample
complaints. **This wipes and recreates the database every time it's run** —
don't run it again once you have real data you want to keep.

### Run the backend

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- API: `http://127.0.0.1:8000`
- Interactive docs (Swagger UI): `http://127.0.0.1:8000/docs`

First startup downloads two local AI models (~1.7 GB total, one-time,
cached under `~/.cache/huggingface` afterward) — expect it to take a minute
or two the first time.

## 3. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

> `--legacy-peer-deps` is needed because of a strict ESLint version pin in
> `package.json` that conflicts with `eslint-plugin-react`'s peer
> requirement — it's a dev-tooling-only conflict, not a runtime issue.

- App: `http://localhost:5173`

The dev server proxies `/api`, `/complaints`, `/department`, and `/worker`
requests to the backend on port 8000 (see `vite.config.js`), so both must be
running for the app to work.

## Test accounts

All seeded by `seed.py`, password `password123` for every account:

| Email | Role |
|---|---|
| `admin@smartcity.com` | Admin |
| `official@smartcity.com` | Department Official |
| `worker@smartcity.com` | Field Worker |
| `citizen@smartcity.com` | Citizen (exempt from 2FA — see note below) |

Citizens other than the exact account above go through email-OTP 2FA on
login. Without real SMTP credentials configured (see
`app/services/email_service.py`), the OTP is printed to the backend's
terminal instead of emailed — check there for the code.

## Accessing from another device on your network

The frontend already binds to `0.0.0.0` (see `vite.config.js`), so once both
servers are running:

1. Find this machine's LAN IP (`ipconfig` on Windows, `ifconfig`/`ip a` on
   macOS/Linux — look for the Wi-Fi/Ethernet adapter, not a virtual one).
2. Make sure your OS firewall allows inbound connections on port `5173`.
3. From another device on the same network, open
   `http://<that-ip>:5173`.

The backend stays bound to `127.0.0.1` only — other devices reach it through
the frontend's proxy, not directly. This is deliberate: the API isn't
hardened for open network exposure.

## Project structure

```
smart-city/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (auth, citizen, department, worker, admin, complaints)
│   │   ├── core/         # Settings, security helpers
│   │   ├── crud/         # Database query helpers
│   │   ├── db/           # SQLAlchemy engine/session setup
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── services/     # AI service, auth, email, file upload
│   │   └── main.py       # FastAPI app entrypoint
│   ├── ai_module/        # Local AI: text classifier, priority engine, duplicate detector, image validator
│   ├── seed.py           # Database seed script
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/   # Shared UI (Sidebar, ComplaintCard, ComplaintForm, MapComponent, ...)
    │   ├── context/       # Auth context
    │   ├── pages/         # Login, Register, and per-role dashboards
    │   └── services/      # API client
    ├── vite.config.js
    └── package.json
```

## Known limitations

- This is a development setup — the SQLite database, JWT secret, and other
  config are not intended for production use as-is.
- Category/severity AI is **text-based only**. There is no vision model in
  this codebase — an uploaded photo is stored and displayed, but its
  contents are never analyzed for classification or routing.
- Email delivery (2FA OTP codes, status-change notifications) needs real
  SMTP credentials in `app/services/email_service.py` to actually send;
  otherwise codes are logged to the backend terminal and notifications are
  silently skipped.

## Troubleshooting

- **`ImportError` / DLL load failed for `cv2` on Windows**: make sure
  `requirements.txt` installs `opencv-python-headless`, not `opencv-python`
  — the GUI build's native DLL frequently fails to load on Windows.
- **Backend crashes with `UnicodeEncodeError` on Windows**: the app forces
  UTF-8 stdout/stderr in `main.py` and `seed.py` to handle emoji in log
  output — make sure you're running the current version of both files.
- **Login returns 401 for a real account**: make sure `SECRET_KEY` in
  `.env` matches what the backend process actually has loaded — restart
  `uvicorn` after changing `.env`.
