"""Forecast error statistics. Error convention: forecast - actual (MW)."""
from __future__ import annotations

import math
from collections import defaultdict
from collections.abc import Iterable

from .config import UK_TZ
from .forecast import Point


def percentile(values: list[float], q: float) -> float:
    """Linear-interpolated percentile, q in [0, 100]."""
    s = sorted(values)
    if not s:
        raise ValueError("percentile of empty list")
    k = (len(s) - 1) * q / 100
    lo, hi = math.floor(k), math.ceil(k)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def summarise(pairs: Iterable[tuple[float, float]]) -> dict | None:
    """Summary stats for (forecast, actual) pairs."""
    pairs = list(pairs)
    if not pairs:
        return None
    errors = [f - a for f, a in pairs]
    n = len(errors)
    mean_actual = sum(a for _, a in pairs) / n
    mae = sum(abs(e) for e in errors) / n
    return {
        "n": n,
        "mae": mae,
        "rmse": math.sqrt(sum(e * e for e in errors) / n),
        "bias": sum(errors) / n,
        "nmae_pct": 100 * mae / mean_actual if mean_actual else None,
        "p10": percentile(errors, 10),
        "p50": percentile(errors, 50),
        "p90": percentile(errors, 90),
        "max_over": max(errors),
        "max_under": min(errors),
        "mean_actual": mean_actual,
    }


def scored(points: Iterable[Point]) -> list[Point]:
    return [p for p in points if p.error is not None]


def by_hour(points: list[Point]) -> list[dict]:
    groups: dict[int, list[Point]] = defaultdict(list)
    for p in scored(points):
        groups[p.time.astimezone(UK_TZ).hour].append(p)
    return [
        {"hour": h, **summarise((p.forecast, p.actual) for p in groups[h])}
        for h in sorted(groups)
    ]


def by_horizon(errors: list[tuple[float, float]], bucket_h: int = 6) -> list[dict]:
    groups: dict[int, list[float]] = defaultdict(list)
    for h, e in errors:
        groups[min(int(h // bucket_h), 47 // bucket_h)].append(e)
    out = []
    for b in sorted(groups):
        es = groups[b]
        out.append({
            "from_h": b * bucket_h,
            "to_h": (b + 1) * bucket_h,
            "n": len(es),
            "mae": sum(abs(e) for e in es) / len(es),
            "bias": sum(es) / len(es),
            "p10": percentile(es, 10),
            "p90": percentile(es, 90),
        })
    return out


def histogram(errors: list[float], bin_mw: int = 500) -> list[dict]:
    counts: dict[int, int] = defaultdict(int)
    for e in errors:
        counts[math.floor(e / bin_mw)] += 1
    if not counts:
        return []
    lo, hi = min(counts), max(counts)
    return [{"from_mw": b * bin_mw, "to_mw": (b + 1) * bin_mw, "count": counts.get(b, 0)} for b in range(lo, hi + 1)]
