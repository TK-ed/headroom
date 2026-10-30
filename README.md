# Headroom

Headroom is a web app for a UK utility's day-ahead power trading team. It answers two questions for purchase decisions made in **January 2026**:

1. **What wind can we count on tomorrow?** It shows the latest national wind forecast that was available at the decision time, together with a likely range based on past errors.
2. **How accurate are the forecasts?** It measures forecast error (MAE, RMSE, bias, P10/P90) overall, by hour of day, by delivery day and by forecast lead time.

**Live app:** https://headroom-dev.vercel.app/
**Live api:** https://headroom.fastapicloud.dev/docs

## Key findings (January 2026, 09:00 decision time)

| Metric | Value |S3422DWG
|---|---|
| Mean absolute error | **2.02 GW** (17.9% of mean wind output, 11.3 GW) |
| Bias | **+1.75 GW**: forecasts were too high in 85% of hours |
| P90 over-forecast | **4.2 GW**: plan for this much less wind to be covered 9 hours out of 10 |
| Lead-time effect | MAE grows from 1.65 GW (0–6 h ahead) to 2.32 GW (42–48 h ahead) |

The forecasts are consistently too high, so buying against the raw forecast leaves the team short. One possible cause is that the actuals are measured after curtailment while the forecast is not. This should be confirmed with the client.

## Tech stack

- **Backend:** Python 3.12 with FastAPI. The forecast logic and metrics are plain Python and are covered by pytest.
- **Frontend:** Next.js 15 (React 19, TypeScript), Tailwind CSS v4, shadcn/ui components (Radix), Recharts for charts and GSAP for small entrance and count-up animations.
- **Data:** Elexon BMRS `FUELHH` (filtered to `fuelType=WIND`) and `WINDFOR`, stored as a JSON snapshot in `backend/data/`.
- **Ops:** Docker, docker-compose, GitHub Actions CI, and configs for both Vercel and Heroku.

## Files and directories

```
.
├── backend/
│   ├── app/
│   │   ├── config.py       # business assumptions: decision window, default cutoff, timezone
│   │   ├── data.py         # loads and parses the Elexon snapshot into a Dataset
│   │   ├── forecast.py     # core rule: latest forecast published before the cutoff (no look-ahead)
│   │   ├── metrics.py      # MAE / RMSE / bias / percentiles, by hour, by horizon, histogram
│   │   └── main.py         # FastAPI endpoints /api/health, /api/meta, /api/day, /api/accuracy
│   ├── data/               # fuelhh.json (actuals), windfor.json (forecasts)
│   ├── scripts/fetch_data.py  # refreshes the snapshot from the Elexon API
│   ├── tests/              # unit tests (selection rule, DST, metrics) and API tests
│   ├── api/index.py        # Vercel serverless entrypoint
│   ├── vercel.json, heroku.yml, Dockerfile
│   └── requirements*.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx                # Delivery plan: one delivery day, forecast vs actual, firm wind
│   │   ├── accuracy/page.tsx       # Forecast review: KPIs and figures 2–5 (lead time, histogram, hour, day)
│   │   ├── api/[...path]/route.ts  # server-side proxy to the backend (reads API_URL at runtime)
│   │   ├── layout.tsx              # fonts, header, footer, theme bootstrap
│   │   └── globals.css             # Tailwind v4 theme tokens (light and dark)
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (button, card, select, tabs, table, tooltip...)
│   │   ├── layout/                 # SiteHeader, PageHeader, Logo, ThemeToggle
│   │   ├── dashboard/              # Panel, StatStrip/Stat, Legend, ChartTooltip, Callout, loading/error states
│   │   ├── filters/                # DaySelect, CutoffSelect, FilterBar
│   │   ├── charts/                 # one component per chart, plus shared axis/tick helpers
│   │   └── motion/                 # GSAP Reveal (staggered fade-in) and CountUp
│   ├── hooks/                      # useData (fetch state), useChartTokens (theme colours for Recharts)
│   ├── lib/                        # api.ts (typed client), format.ts (GW/time), utils.ts (cn)
│   ├── components.json             # shadcn config
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml       # runs pytest, eslint and the Next.js build
```

## How it works

- **Decision rule.** For delivery day *D*, the decision is taken on *D−1* at the cutoff time (UK local, 09:00 by default, adjustable in the UI). For each hour of *D*, the app uses the **most recent `WINDFOR` forecast with `publishTime` ≤ cutoff**. Later forecasts are never used. Tests check this, including on clock-change days.
- **Scope.** Decisions from 1–31 Jan 2026 cover delivery days 2 Jan to 1 Feb 2026, which is 744 hourly points, all of them scored.
- **Resolution.** Forecasts are hourly and actuals are half-hourly. Errors are scored on the hour, and the chart shows the full half-hourly actuals.
- **Error sign.** Error = forecast − actual. A positive error means less wind turned up than planned, so the shortfall has to be bought.
- **Likely range.** This is forecast − P90 error up to forecast − P10 error, using errors from the whole month at the same cutoff. It is an in-sample estimate for the pilot; a production version would use a rolling window of past errors only.
- **Horizon analysis.** This uses every forecast issued 0–48 h before each target hour, not just the one chosen at the decision time. It shows how error grows with lead time.

## Running the app

### With Docker
```bash
docker compose up --build
# frontend: http://localhost:3000   backend: http://localhost:8000/docs
```

### Without Docker
```bash
# backend
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/pytest -q                       # 16 tests
.venv/bin/uvicorn app.main:app --port 8000

# frontend (second terminal)
cd frontend
npm install
API_URL=http://localhost:8000 npm run dev  # http://localhost:3000
```

### Refreshing the data
```bash
cd backend && .venv/bin/python -m scripts.fetch_data
```

## Deployment

- **Vercel (recommended):** create two projects from this repo.
  1. **Backend:** root directory `backend`. Vercel's Python runtime serves FastAPI through `api/index.py`.
  2. **Frontend:** root directory `frontend`, with environment variable `API_URL=<backend URL>`.
- **Heroku (alternative):** run `heroku stack:set container` and push `backend/`. It deploys with `heroku.yml` and `Dockerfile`. Deploy the frontend the same way, or to Vercel.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/meta` | delivery days, default cutoff, forecast publish times |
| `GET /api/day?date=2026-01-15&cutoff=09:00` | hourly forecast vs actual for one delivery day, plus that day's summary |
| `GET /api/accuracy?cutoff=09:00` | overall stats, by hour, daily, histogram, by horizon |

Interactive docs are available at `/docs` (FastAPI Swagger).
