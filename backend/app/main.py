"""HTTP API for the wind forecast monitor."""
from __future__ import annotations

from datetime import date, datetime, time, timedelta
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import config, metrics
from .data import get_dataset
from .forecast import (
    ForecastIndex,
    Point,
    decision_cutoff,
    decision_points,
    half_hourly_actuals,
    horizon_errors,
)

app = FastAPI(title="Wind Forecast Monitor API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])

CUTOFF_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"


@lru_cache(maxsize=1)
def get_index() -> ForecastIndex:
    return ForecastIndex(get_dataset().forecasts)


def delivery_days() -> list[date]:
    n = (config.DECISION_LAST_DAY - config.DECISION_FIRST_DAY).days + 1
    return [config.DECISION_FIRST_DAY + timedelta(days=i + 1) for i in range(n)]


def parse_cutoff(value: str) -> time:
    return time.fromisoformat(value)


def iso(dt: datetime | None) -> str | None:
    return dt.isoformat().replace("+00:00", "Z") if dt else None


def point_json(p: Point) -> dict:
    return {
        "time": iso(p.time),
        "forecast": p.forecast,
        "actual": p.actual,
        "error": p.error,
        "publish_time": iso(p.publish_time),
        "horizon_h": p.horizon_h,
    }


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/meta")
def meta() -> dict:
    ds = get_dataset()
    days = delivery_days()
    return {
        "decision_window": [config.DECISION_FIRST_DAY.isoformat(), config.DECISION_LAST_DAY.isoformat()],
        "delivery_days": [d.isoformat() for d in days],
        "default_cutoff": config.DEFAULT_CUTOFF.strftime("%H:%M"),
        "timezone": "Europe/London",
        "forecast_publish_times": sorted({f.publish_time.strftime("%H:%M") for f in ds.forecasts}),
        "rows": {"actuals": len(ds.actuals), "forecasts": len(ds.forecasts)},
        "source": "Elexon BMRS: FUELHH (fuelType=WIND) and WINDFOR",
    }


@app.get("/api/day")
def day(
    delivery_date: date = Query(..., alias="date", description="Delivery day (UK), YYYY-MM-DD"),
    cutoff: str = Query(config.DEFAULT_CUTOFF.strftime("%H:%M"), pattern=CUTOFF_PATTERN),
) -> dict:
    if delivery_date not in delivery_days():
        raise HTTPException(404, "Date outside the January 2026 decision window")
    cut = parse_cutoff(cutoff)
    ds = get_dataset()
    points = decision_points(ds, get_index(), delivery_date, cut)
    scored = metrics.scored(points)
    publish_times = {p.publish_time for p in points if p.publish_time}
    return {
        "date": delivery_date.isoformat(),
        "decision_time": iso(decision_cutoff(delivery_date, cut)),
        "forecast_publish_time": iso(max(publish_times)) if publish_times else None,
        "points": [point_json(p) for p in points],
        "actuals_half_hourly": [{"time": iso(t), "actual": v} for t, v in half_hourly_actuals(ds, delivery_date)],
        "summary": metrics.summarise((p.forecast, p.actual) for p in scored),
        "energy_mwh": {
            "forecast": sum(p.forecast for p in points if p.forecast is not None),
            "actual": sum(p.actual for p in scored),
        },
    }


@lru_cache(maxsize=32)
def _accuracy(cutoff: str) -> dict:
    cut = parse_cutoff(cutoff)
    ds, index = get_dataset(), get_index()
    days = delivery_days()
    per_day = {d: decision_points(ds, index, d, cut) for d in days}
    all_points = [p for pts in per_day.values() for p in pts]
    scored = metrics.scored(all_points)

    daily = []
    for d, pts in per_day.items():
        s = metrics.summarise((p.forecast, p.actual) for p in metrics.scored(pts))
        if s:
            daily.append({"date": d.isoformat(), "mae": s["mae"], "bias": s["bias"], "mean_actual": s["mean_actual"]})

    targets = [p.time for p in all_points]
    return {
        "cutoff": cutoff,
        "overall": metrics.summarise((p.forecast, p.actual) for p in scored),
        "by_hour": metrics.by_hour(all_points),
        "daily": daily,
        "histogram": metrics.histogram([p.error for p in scored]),
        "by_horizon": metrics.by_horizon(horizon_errors(ds, index, targets)),
        "decision_horizon_h": [min(p.horizon_h for p in scored), max(p.horizon_h for p in scored)] if scored else None,
        "coverage": {"hours": len(all_points), "scored": len(scored)},
    }


@app.get("/api/accuracy")
def accuracy(cutoff: str = Query(config.DEFAULT_CUTOFF.strftime("%H:%M"), pattern=CUTOFF_PATTERN)) -> dict:
    return _accuracy(cutoff)
