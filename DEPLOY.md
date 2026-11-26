# Deploying Vistara

| Part | Host | Notes |
|---|---|---|
| Web app (`frontend/`) | **GitHub Pages** — https://jbpchc.github.io/Vistara/ | Built by `.github/workflows/deploy-pages.yml` on every push |
| API (`backend/`) | **Render** free web service | `render.yaml` blueprint |
| Database | **TiDB Cloud Starter** (MySQL-compatible, free) | TLS required (`DB_SSL=true`) |

Without the API, the web app runs in **demo mode** (in-browser sample data). Once the repo variable
`VITE_API_BASE_URL` is set, Pages rebuilds in **live mode** against the real API and database.

## 1. Database — TiDB Cloud (~5 min)
1. Sign up at https://tidbcloud.com → create a **Starter** cluster (region: Singapore if offered).
2. **Connect** → note **host**, **port 4000**, **user** (looks like `xxxx.root`) and generate a **password**.
3. **SQL Editor** → run `CREATE DATABASE vistara;`

## 2. API — Render (~5 min)
1. Sign up at https://render.com with GitHub; allow access to `jbpchc/Vistara`.
2. **New → Blueprint** → pick `Vistara` → **Apply**.
3. Fill in `DB_HOST`, `DB_USER`, `DB_PASSWORD` from TiDB. Everything else is preset.
4. Wait for **Live**, then open `https://<your-service>.onrender.com/api/health` → `"status":"OK"`.
   The first start creates the tables and the demo accounts (`SEED_ON_START=true`).

## 3. Switch the web app to live mode (~1 min)
1. GitHub repo → **Settings → Secrets and variables → Actions → Variables → New repository variable**
   - Name: `VITE_API_BASE_URL`  Value: `https://<your-service>.onrender.com/api`
2. **Actions → Deploy demo to GitHub Pages → Run workflow** (or push any commit).

## Accounts (created by the seed)
| Role | Username | Password |
|---|---|---|
| Admin | `admin_test` | `Password@123` |
| Guard | `guard_alpha` | `Password@123` |
| Resident | `juan_dela_cruz` | `Password@123` |

The login screen shows **Continue as Admin / Resident / Guard** buttons for these accounts.
Change the passwords after grading — the site is public.

## Notes
- The free API **sleeps after 15 minutes idle**; the first request then takes ~1 minute. Open the site a couple of minutes before a demo.
- To test the full flow: Guard → Walk-in (no pass) → *Ask resident to approve* → in another browser, Resident → **Approve** → Guard → **Admit**.
- Local development without MySQL: `DB_DIALECT=sqlite DB_STORAGE=./dev.db SEED_ON_START=true JWT_SECRET=dev npm start` (needs `npm i --no-save sqlite3`).

## Troubleshooting
| Symptom | Fix |
|---|---|
| API log: `Database connection failed` | Check TiDB host/user/password; `DB_SSL` must be `true` |
| Browser: CORS error | `FRONTEND_URL` must be exactly `https://jbpchc.github.io` (no path, no trailing slash) |
| Site still shows "Demo — sample data" | Variable name must be `VITE_API_BASE_URL`; re-run the Pages workflow |
| First load very slow | Free API was asleep — wait ~1 minute |
