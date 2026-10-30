from datetime import date, datetime, time, timezone

from app.data import build_dataset
from app.forecast import ForecastIndex, decision_cutoff, decision_points, hourly_targets, horizon_errors


def utc(*args) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def rows():
    actuals = [
        {"startTime": "2026-01-10T00:00:00Z", "generation": 1000, "fuelType": "WIND"},
        {"startTime": "2026-01-10T00:30:00Z", "generation": 1100, "fuelType": "WIND"},
        {"startTime": "2026-01-10T01:00:00Z", "generation": 1200, "fuelType": "WIND"},
    ]
    forecasts = [
        # older forecast, before cutoff
        {"publishTime": "2026-01-09T04:30:00Z", "startTime": "2026-01-10T00:00:00Z", "generation": 800},
        # latest before the 09:00 cutoff -> must be chosen
        {"publishTime": "2026-01-09T07:30:00Z", "startTime": "2026-01-10T00:00:00Z", "generation": 900},
        # published after cutoff -> must never be used (no look-ahead)
        {"publishTime": "2026-01-09T09:30:00Z", "startTime": "2026-01-10T00:00:00Z", "generation": 1000},
        {"publishTime": "2026-01-09T07:30:00Z", "startTime": "2026-01-10T01:00:00Z", "generation": 1300},
    ]
    return actuals, forecasts


def test_cutoff_is_previous_day_uk_time():
    assert decision_cutoff(date(2026, 1, 10), time(9, 0)) == utc(2026, 1, 9, 9, 0)
    # British Summer Time: 09:00 BST = 08:00 UTC
    assert decision_cutoff(date(2026, 7, 10), time(9, 0)) == utc(2026, 7, 9, 8, 0)


def test_delivery_day_has_23_or_25_hours_on_clock_change():
    assert len(hourly_targets(date(2026, 1, 10))) == 24
    assert len(hourly_targets(date(2026, 3, 29))) == 23
    assert len(hourly_targets(date(2026, 10, 25))) == 25


def test_latest_forecast_before_cutoff_is_used():
    ds = build_dataset(*rows())
    points = decision_points(ds, ForecastIndex(ds.forecasts), date(2026, 1, 10), time(9, 0))
    first = points[0]
    assert first.forecast == 900
    assert first.publish_time == utc(2026, 1, 9, 7, 30)
    assert first.horizon_h == 16.5
    assert first.error == -100


def test_later_cutoff_picks_newer_forecast():
    ds = build_dataset(*rows())
    points = decision_points(ds, ForecastIndex(ds.forecasts), date(2026, 1, 10), time(10, 0))
    assert points[0].forecast == 1000


def test_missing_forecast_or_actual_is_not_scored():
    ds = build_dataset(*rows())
    points = decision_points(ds, ForecastIndex(ds.forecasts), date(2026, 1, 10), time(9, 0))
    assert points[2].forecast is None and points[2].error is None


def test_horizon_errors_cover_every_forecast():
    ds = build_dataset(*rows())
    errs = horizon_errors(ds, ForecastIndex(ds.forecasts), [utc(2026, 1, 10, 0)])
    assert sorted(errs) == [(14.5, 0.0), (16.5, -100.0), (19.5, -200.0)]
