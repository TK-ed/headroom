"""Loading Elexon data (cached JSON snapshot, refreshable from the live API)."""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from . import config


@dataclass(frozen=True)
class Forecast:
    publish_time: datetime
    start_time: datetime
    generation: float  # MW


@dataclass
class Dataset:
    actuals: dict[datetime, float]  # startTime (UTC) -> MW, 30-min resolution
    forecasts: list[Forecast]  # sorted by publish_time


def parse_ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def build_dataset(actual_rows: list[dict], forecast_rows: list[dict]) -> Dataset:
    actuals = {
        parse_ts(r["startTime"]): float(r["generation"])
        for r in actual_rows
        if r.get("fuelType", "WIND") == "WIND"
    }
    forecasts = sorted(
        (
            Forecast(parse_ts(r["publishTime"]), parse_ts(r["startTime"]), float(r["generation"]))
            for r in forecast_rows
        ),
        key=lambda f: (f.publish_time, f.start_time),
    )
    return Dataset(actuals=actuals, forecasts=forecasts)


def _read(path: Path) -> list[dict]:
    with path.open() as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def get_dataset() -> Dataset:
    """Dataset used by the API. Loaded once per process from the committed snapshot."""
    return build_dataset(_read(config.ACTUALS_FILE), _read(config.FORECASTS_FILE))
