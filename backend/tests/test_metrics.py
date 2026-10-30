import math

import pytest

from app.metrics import by_horizon, histogram, percentile, summarise


def test_percentile_interpolates():
    assert percentile([1, 2, 3, 4, 5], 50) == 3
    assert percentile([0, 10], 90) == 9
    with pytest.raises(ValueError):
        percentile([], 50)


def test_summarise_known_values():
    s = summarise([(110, 100), (90, 100), (130, 100)])  # errors 10, -10, 30
    assert s["n"] == 3
    assert s["mae"] == pytest.approx(50 / 3)
    assert s["bias"] == pytest.approx(10)
    assert s["rmse"] == pytest.approx(math.sqrt(1100 / 3))
    assert s["nmae_pct"] == pytest.approx(50 / 3)
    assert s["max_over"] == 30 and s["max_under"] == -10


def test_summarise_empty():
    assert summarise([]) is None


def test_by_horizon_buckets():
    out = by_horizon([(1, 100), (5, -100), (7, 50), (48, 10)])
    assert [(b["from_h"], b["n"]) for b in out] == [(0, 2), (6, 1), (42, 1)]
    assert out[0]["mae"] == 100 and out[0]["bias"] == 0


def test_histogram_fills_gaps():
    out = histogram([-600, 100, 1200], bin_mw=500)
    assert [b["from_mw"] for b in out] == [-1000, -500, 0, 500, 1000]
    assert [b["count"] for b in out] == [1, 0, 1, 0, 1]
