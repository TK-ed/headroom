"""API tests against the committed January 2026 snapshot."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_meta_lists_31_delivery_days():
    body = client.get("/api/meta").json()
    assert len(body["delivery_days"]) == 31
    assert body["delivery_days"][0] == "2026-01-02"
    assert body["delivery_days"][-1] == "2026-02-01"


def test_day_uses_forecast_published_before_decision():
    body = client.get("/api/day", params={"date": "2026-01-15"}).json()
    assert len(body["points"]) == 24
    assert body["forecast_publish_time"] <= body["decision_time"]
    assert all(p["publish_time"] <= body["decision_time"] for p in body["points"])
    assert len(body["actuals_half_hourly"]) == 48


def test_day_rejects_out_of_window_and_bad_cutoff():
    assert client.get("/api/day", params={"date": "2026-01-01"}).status_code == 404
    assert client.get("/api/day", params={"date": "2026-01-15", "cutoff": "9am"}).status_code == 422


def test_accuracy_covers_whole_month():
    body = client.get("/api/accuracy").json()
    assert body["coverage"] == {"hours": 744, "scored": 744}
    assert len(body["by_hour"]) == 24
    assert len(body["daily"]) == 31
    assert body["by_horizon"][0]["from_h"] == 0
