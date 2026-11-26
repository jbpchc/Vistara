# Deploying Vistara

## Option A: GitHub Pages demo (no backend). Used for the semi-final.
The frontend is built with `VITE_DEMO=true`, so a fake in-browser API (`frontend/src/api/demo.js`) answers every request with sample data.
The login screen shows **Continue as Admin / Resident / Guard** buttons. Changes reset when the page is reloaded.

1. Go to repo **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main`, or open **Actions → Deploy demo to GitHub Pages → Run workflow**.
3. The site goes live at **https://jbpchc.github.io/Vistara/**.

> GitHub Pages on a **private** repo needs GitHub Pro. It's free with the GitHub Student Developer Pack. Otherwise make the repo public.

To run the demo locally: `cd frontend && VITE_DEMO=true npm run dev`.

## Option B: Full stack (real database). Use this for the final defense.

The whole setup is free:

| Part | Host | Why |
|---|---|---|
| Database (MySQL) | **TiDB Cloud Starter** | It speaks MySQL, so the Sequelize code works unchanged. Free tier, no card. |
| API (`backend/`) | **Render web service** (free) | Node and Express, deployed from GitHub. |
| Web app (`frontend/`) | **Render static site** (free) | Always on, with no cold start. |

> The free API **sleeps after 15 minutes idle**, and the first request then takes about 1 minute.
> Open the site about 2 minutes before anyone grades or demos it.

## 1. Database: TiDB Cloud (about 5 min)
1. Sign up at https://tidbcloud.com and create a **Starter** cluster. Pick a region close to Singapore.
2. In **Connect**, choose "General" / Node.js. Note the host, the port (4000), the user (it looks like `xxxx.root`) and the password.
3. Open the **SQL Editor** and run:
   ```sql
   CREATE DATABASE vistara;
   ```

## 2. API and web app: Render Blueprint (about 10 min)
1. Sign up at https://render.com with GitHub and allow access to `jbpchc/Vistara`.
2. Go to **New → Blueprint**, pick `Vistara`, and click **Apply**. It reads `render.yaml` and creates `vistara-api` and `vistara-web`.
3. When asked, fill in these values:

   | Key | Value |
   |---|---|
   | `DB_HOST` | Host from TiDB |
   | `DB_USER` | User from TiDB |
   | `DB_PASSWORD` | Password from TiDB |
   | `FRONTEND_URL` | `https://vistara-web.onrender.com`. Use the real URL Render shows. |
   | `VITE_API_BASE_URL` | `https://vistara-api.onrender.com/api`. Keep the `/api` at the end. |

4. Wait until both services show **Live**. The API creates its tables on first start (`sequelize.sync`).
5. Check that the API is up: open `https://vistara-api.onrender.com/api/health`. It should return `"status":"OK"`.

## 3. Demo accounts
In Render, go to **vistara-api → Shell** and run:
```bash
npm run seed
```
This creates the accounts `admin_test`, `guard_alpha` and `juan_dela_cruz`. All use the password from `seed.js`.
**Change these passwords after grading.** The site is public.

## 4. Finish
- Put the web URL in `README.md` under "Deployed link".
- If you changed `FRONTEND_URL` or `VITE_API_BASE_URL`, redeploy that service.
  - Vite reads `VITE_*` only at build time.

## Troubleshooting
| Symptom | Cause → fix |
|---|---|
| The API log shows `Database connection failed` | Wrong TiDB host, user or password, or `DB_SSL` isn't `true` → fix the env vars in Render and redeploy. |
| The browser console shows a CORS error | `FRONTEND_URL` doesn't exactly match the site URL. It must use https and have no trailing slash. |
| Login does nothing; requests go to `/api/...` on the static site | `VITE_API_BASE_URL` was missing at build → set it, then go to **Manual Deploy → Clear cache & deploy**. |
| Refreshing `/admin/dashboard` gives a 404 | The SPA rewrite is missing → it's in `render.yaml`; reapply the Blueprint. |
| The first load is very slow | The free API was asleep. Wait about 1 minute. |
