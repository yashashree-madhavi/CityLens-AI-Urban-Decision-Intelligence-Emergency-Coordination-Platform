
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

from app.services.flood_risk_service import calculate_flood_risk


def make_weather(
    rain_15min=0,
    rain_1hr=0,
    rain_3hr=0,
    rain_24hr=0,
    timestamp=None,
):
    return SimpleNamespace(
        bmc_location_id=1,
        station_name="Test Station",
        latitude=19.07,
        longitude=72.87,
        timestamp=timestamp or datetime.now(timezone.utc),
        rain_15min=rain_15min,
        rain_1hr=rain_1hr,
        rain_3hr=rain_3hr,
        rain_24hr=rain_24hr,
    )


def make_db(weather):
    db = MagicMock()
    db.query.return_value.filter.return_value.order_by.return_value.first.return_value = weather
    return db


def test_no_weather_data():
    db = make_db(None)

    result = calculate_flood_risk(db, 1)

    assert result is None


def test_fresh_weather_low_risk():
    weather = make_weather(
        rain_15min=0,
        rain_1hr=0,
        rain_3hr=0,
        rain_24hr=0,
    )

    result = calculate_flood_risk(make_db(weather), 1)

    assert result["data_status"] == "FRESH"
    assert result["risk_score"] == 0
    assert result["risk_level"] == "LOW"


def test_high_rainfall_critical_risk():
    weather = make_weather(
        rain_15min=20,
        rain_1hr=50,
        rain_3hr=100,
        rain_24hr=120,
    )

    result = calculate_flood_risk(make_db(weather), 1)

    assert result["risk_score"] == 100
    assert result["risk_level"] == "CRITICAL"


def test_stale_weather_is_unavailable_for_scoring():
    weather = make_weather(
        rain_15min=20,
        rain_1hr=50,
        rain_3hr=100,
        rain_24hr=120,
        timestamp=datetime.now(timezone.utc) - timedelta(minutes=60),
    )

    result = calculate_flood_risk(make_db(weather), 1)

    assert result["data_status"] == "STALE"
    assert result["risk_score"] is None
    assert result["risk_level"] == "UNAVAILABLE"
    assert result["ml_prediction"] is None


def test_missing_rainfall_measurement():
    weather = make_weather(
        rain_15min=10,
        rain_1hr=None,
        rain_3hr=30,
        rain_24hr=40,
    )

    result = calculate_flood_risk(make_db(weather), 1)

    assert result["data_status"] == "UNAVAILABLE"
    assert result["risk_score"] is None
    assert result["risk_level"] == "UNAVAILABLE"


def test_future_weather_timestamp():
    weather = make_weather(
        timestamp=datetime.now(timezone.utc) + timedelta(minutes=10)
    )

    result = calculate_flood_risk(make_db(weather), 1)

    assert result["data_status"] == "UNAVAILABLE"
    assert result["risk_score"] is None


def test_ml_prediction_is_not_fabricated():
    weather = make_weather()

    result = calculate_flood_risk(make_db(weather), 1)

    assert result["ml_prediction"] is None
    assert any(
        "ML prediction skipped" in reason
        for reason in result["reasons"]
    )
