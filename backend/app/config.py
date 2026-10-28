"""Static settings for the pilot. Everything that is a business assumption lives here."""
from datetime import date, time
from pathlib import Path
from zoneinfo import ZoneInfo

UK_TZ = ZoneInfo("Europe/London")

# Purchase decisions made in January 2026 -> delivery days 2 Jan .. 1 Feb 2026.
DECISION_FIRST_DAY = date(2026, 1, 1)
DECISION_LAST_DAY = date(2026, 1, 31)

# Day-ahead decision deadline on the day before delivery (UK local time).
# Assumption: the team finalises bids shortly before the GB day-ahead auction
# gate closure. Configurable per request via the `cutoff` query parameter.
DEFAULT_CUTOFF = time(9, 0)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ACTUALS_FILE = DATA_DIR / "fuelhh.json"
FORECASTS_FILE = DATA_DIR / "windfor.json"

ELEXON_BASE = "https://data.elexon.co.uk/bmrs/api/v1/datasets"
