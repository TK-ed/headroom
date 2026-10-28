"""Which forecast was available when the buying decision was made.

Rule: for delivery day D, the decision is taken on D-1 at the cutoff (UK time).
For every hourly target time in D we use the *latest* forecast whose
publishTime <= cutoff. Anything published after the cutoff is never used,
so the analysis has no look-ahead.
"""
from __future__ import annotations

from bisect import bisect_right
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone

from .config import UK_TZ
from .data import Dataset, Forecast


@dataclass(frozen=True)
class Point:
    time: datetime  # target time (UTC)
    forecast: float | None
    actual: float | None
    publish_time: datetime | None
    horizon_h: float | None  # hours between publish and target

    @property
    def error(self) -> float | None:
        """forecast - actual. Positive = wind over-forecast = shortfall to buy."""
        if self.forecast is None or self.actual is None:
            return None
        return self.forecast - self.actual


class ForecastIndex:
    """Forecasts grouped by target time, each group sorted by publish time."""

    def __init__(self, forecasts: list[Forecast]):
        groups: dict[datetime, list[Forecast]] = defaultdict(list)
        for f in forecasts:
            groups[f.start_time].append(f)
        self._groups = {t: sorted(g, key=lambda f: f.publish_time) for t, g in groups.items()}
        self._publish = {t: [f.publish_time for f in g] for t, g in self._groups.items()}

    def latest_before(self, target: datetime, cutoff: datetime) -> Forecast | None:
        publish = self._publish.get(target)
        if not publish:
            return None
        i = bisect_right(publish, cutoff)
        return self._groups[target][i - 1] if i else None

    def all_for(self, target: datetime) -> list[Forecast]:
        return self._groups.get(target, [])


def decision_cutoff(delivery_day: date, cutoff: time) -> datetime:
    """Decision moment for a delivery day, as UTC."""
    local = datetime.combine(delivery_day - timedelta(days=1), cutoff, tzinfo=UK_TZ)
    return local.astimezone(timezone.utc)


def day_bounds(delivery_day: date) -> tuple[datetime, datetime]:
    """UK-local delivery day as a UTC [start, end) range (handles clock changes)."""
    start = datetime.combine(delivery_day, time(0), tzinfo=UK_TZ).astimezone(timezone.utc)
    end = datetime.combine(delivery_day + timedelta(days=1), time(0), tzinfo=UK_TZ).astimezone(timezone.utc)
    return start, end


def hourly_targets(delivery_day: date) -> list[datetime]:
    start, end = day_bounds(delivery_day)
    hours = int((end - start).total_seconds() // 3600)
    return [start + timedelta(hours=h) for h in range(hours)]


def decision_points(ds: Dataset, index: ForecastIndex, delivery_day: date, cutoff: time) -> list[Point]:
    cut = decision_cutoff(delivery_day, cutoff)
    points = []
    for target in hourly_targets(delivery_day):
        f = index.latest_before(target, cut)
        points.append(
            Point(
                time=target,
                forecast=f.generation if f else None,
                actual=ds.actuals.get(target),
                publish_time=f.publish_time if f else None,
                horizon_h=(target - f.publish_time).total_seconds() / 3600 if f else None,
            )
        )
    return points


def half_hourly_actuals(ds: Dataset, delivery_day: date) -> list[tuple[datetime, float]]:
    start, end = day_bounds(delivery_day)
    return sorted((t, v) for t, v in ds.actuals.items() if start <= t < end)


def horizon_errors(
    ds: Dataset, index: ForecastIndex, targets: list[datetime], max_horizon_h: float = 48
) -> list[tuple[float, float]]:
    """(horizon_h, error) for every published forecast of the given targets."""
    out = []
    for target in targets:
        actual = ds.actuals.get(target)
        if actual is None:
            continue
        for f in index.all_for(target):
            h = (target - f.publish_time).total_seconds() / 3600
            if 0 <= h <= max_horizon_h:
                out.append((h, f.generation - actual))
    return out
