"""Refresh the data snapshot from the Elexon BMRS API.

Usage:  python -m scripts.fetch_data   (run from backend/)

Window: forecasts published from 28 Dec 2025 (so every January decision has
history to look back on) and actuals for 31 Dec 2025 .. 2 Feb 2026 (covers all
delivery days 2 Jan .. 1 Feb plus a margin).
"""
import json

import httpx

from app import config

FORECAST_PARAMS = {
    "publishDateTimeFrom": "2025-12-28T00:00:00Z",
    "publishDateTimeTo": "2026-02-02T00:00:00Z",
}
ACTUAL_PARAMS = {
    "settlementDateFrom": "2025-12-31",
    "settlementDateTo": "2026-02-02",
    "fuelType": "WIND",
}


def fetch(dataset: str, params: dict) -> list[dict]:
    resp = httpx.get(f"{config.ELEXON_BASE}/{dataset}/stream", params=params, timeout=60)
    resp.raise_for_status()
    return resp.json()


def main() -> None:
    config.DATA_DIR.mkdir(exist_ok=True)
    for dataset, params, path in (
        ("FUELHH", ACTUAL_PARAMS, config.ACTUALS_FILE),
        ("WINDFOR", FORECAST_PARAMS, config.FORECASTS_FILE),
    ):
        rows = fetch(dataset, params)
        path.write_text(json.dumps(rows))
        print(f"{dataset}: {len(rows)} rows -> {path}")


if __name__ == "__main__":
    main()
