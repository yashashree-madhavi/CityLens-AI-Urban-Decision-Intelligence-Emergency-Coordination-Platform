
from app.ai.flood_model_service import predict_heavy_rain
from app.ai.rainfall_feature_service import build_latest_features


def forecast_heavy_rain(daily_observations: list[dict]) -> dict:
    """
    Generate an experimental heavy-rain prediction from consecutive
    daily rainfall observations.

    Each observation must contain:
        date: YYYY-MM-DD
        rainfall_mm: daily rainfall amount in mm
    """
    try:
        features = build_latest_features(daily_observations)
        result = predict_heavy_rain(features)

        return {
            "status": "success",
            "forecast_type": "experimental_ml",
            "forecast_date": daily_observations[-1]["date"],
            "features_used": features,
            "prediction": result["prediction"],
            "heavy_rain_probability": result["heavy_rain_probability"],
            "threshold": result["threshold"],
            "model_name": result["model_name"],
            "warning": (
                "Experimental model output based on supplied daily rainfall "
                "history. This is not a verified live flood warning."
            ),
        }

    except (ValueError, FileNotFoundError) as exc:
        return {
            "status": "unavailable",
            "forecast_type": "experimental_ml",
            "prediction": None,
            "reason": str(exc),
        }
