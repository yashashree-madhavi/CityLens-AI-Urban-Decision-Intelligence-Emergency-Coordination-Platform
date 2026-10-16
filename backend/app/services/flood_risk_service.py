
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.bmc_weather import BMCWeatherData
from app.ai.flood_prediction import predict_heavy_rain


def calculate_flood_risk(
    db: Session,
    bmc_location_id: int,
):
    """
    Calculate an explainable flood-risk score from the latest
    BMC weather observation.

    Old or missing observations must never be presented as LOW risk.
    The ML model is not run when observations are unavailable.
    """

    weather = (
        db.query(BMCWeatherData)
        .filter(
            BMCWeatherData.bmc_location_id == bmc_location_id
        )
        .order_by(BMCWeatherData.timestamp.desc())
        .first()
    )

    if not weather:
        return None

    now = datetime.now().astimezone()
    weather_timestamp = weather.timestamp

    # Normalize timestamps before comparing them.
    if weather_timestamp.tzinfo is None:
        weather_timestamp = weather_timestamp.replace(
            tzinfo=now.tzinfo
        )
    else:
        weather_timestamp = weather_timestamp.astimezone(
            now.tzinfo
        )

    data_age_minutes = (
        now - weather_timestamp
    ).total_seconds() / 60

    # A future-dated observation may indicate a clock/data issue.
    if data_age_minutes < -5:
        data_status = "UNAVAILABLE"
        freshness_reason = "Weather observation has a future timestamp"
    elif data_age_minutes <= 30:
        data_status = "FRESH"
        freshness_reason = None
    elif data_age_minutes <= 90:
        data_status = "STALE"
        freshness_reason = "Weather observation is stale"
    else:
        data_status = "UNAVAILABLE"
        freshness_reason = "Current BMC weather data is unavailable"

    # Keep rainfall values for transparency, but do not treat
    # missing values as proof that rainfall is zero.
    rainfall_fields = {
        "rain_15min": weather.rain_15min,
        "rain_1hr": weather.rain_1hr,
        "rain_3hr": weather.rain_3hr,
        "rain_24hr": weather.rain_24hr,
    }

    rainfall = {
        key: value
        for key, value in rainfall_fields.items()
    }

    # Do not calculate a risk score from stale/unavailable readings.
    if data_status != "FRESH":
        return {
            "bmc_location_id": weather.bmc_location_id,
            "station_name": weather.station_name,
            "latitude": weather.latitude,
            "longitude": weather.longitude,
            "timestamp": weather.timestamp,
            "data_status": data_status,
            "data_age_minutes": round(
                max(data_age_minutes, 0), 1
            ),
            "risk_score": None,
            "risk_level": "UNAVAILABLE",
            "ml_prediction": None,
            "rainfall": rainfall,
            "reasons": [freshness_reason],
        }

    # A missing rainfall field is not the same as zero rainfall.
    if any(value is None for value in rainfall_fields.values()):
        return {
            "bmc_location_id": weather.bmc_location_id,
            "station_name": weather.station_name,
            "latitude": weather.latitude,
            "longitude": weather.longitude,
            "timestamp": weather.timestamp,
            "data_status": "UNAVAILABLE",
            "data_age_minutes": round(
                max(data_age_minutes, 0), 1
            ),
            "risk_score": None,
            "risk_level": "UNAVAILABLE",
            "ml_prediction": None,
            "rainfall": rainfall,
            "reasons": [
                "One or more rainfall measurements are missing"
            ],
        }

    rain_15min = float(weather.rain_15min)
    rain_1hr = float(weather.rain_1hr)
    rain_3hr = float(weather.rain_3hr)
    rain_24hr = float(weather.rain_24hr)

    score = 0
    reasons = []

    # 15-minute rainfall
    if rain_15min >= 20:
        score += 35
        reasons.append("Very high short-term rainfall")
    elif rain_15min >= 10:
        score += 25
        reasons.append("High short-term rainfall")
    elif rain_15min >= 5:
        score += 15
        reasons.append("Moderate short-term rainfall")
    else:
        reasons.append("Low short-term rainfall")

    # 1-hour rainfall
    if rain_1hr >= 50:
        score += 30
        reasons.append("Very high 1-hour rainfall")
    elif rain_1hr >= 30:
        score += 20
        reasons.append("High 1-hour rainfall")
    elif rain_1hr >= 15:
        score += 10
        reasons.append("Moderate 1-hour rainfall")

    # 3-hour rainfall
    if rain_3hr >= 100:
        score += 25
        reasons.append("Very high 3-hour rainfall accumulation")
    elif rain_3hr >= 70:
        score += 20
        reasons.append("High 3-hour rainfall accumulation")
    elif rain_3hr >= 30:
        score += 10
        reasons.append("Moderate 3-hour rainfall accumulation")

    # 24-hour rainfall
    if rain_24hr >= 120:
        score += 20
        reasons.append("Very high 24-hour rainfall accumulation")
    elif rain_24hr >= 70:
        score += 15
        reasons.append("High 24-hour rainfall accumulation")
    elif rain_24hr >= 30:
        score += 10
        reasons.append("Moderate 24-hour rainfall accumulation")
    elif rain_24hr > 0:
        reasons.append(
            f"Low 24-hour rainfall accumulation ({rain_24hr} mm)"
        )
    else:
        reasons.append("No significant 24-hour rainfall accumulation")

    score = min(score, 100)

    if score >= 70:
        risk_level = "CRITICAL"
    elif score >= 50:
        risk_level = "HIGH"
    elif score >= 25:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    # Do not fabricate 3-day/7-day rainfall inputs from shorter windows.
    # Use the model only if it can be called without those false proxies.
    ml_prediction = None
    reasons.append(
        "ML prediction skipped: verified 3-day and 7-day rainfall "
        "inputs are not available in the current observation"
    )

    return {
        "bmc_location_id": weather.bmc_location_id,
        "station_name": weather.station_name,
        "latitude": weather.latitude,
        "longitude": weather.longitude,
        "timestamp": weather.timestamp,
        "data_status": data_status,
        "data_age_minutes": round(
            max(data_age_minutes, 0), 1
        ),
        "risk_score": score,
        "risk_level": risk_level,
        "ml_prediction": ml_prediction,
        "rainfall": rainfall,
        "reasons": reasons,
    }
