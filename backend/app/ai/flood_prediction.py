from pathlib import Path
import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent / "flood_model.joblib"
_model = None

def get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
    return _model


FEATURES = [
    "month",
    "day_of_year",
    "rainfall_previous_day",
    "rainfall_3day",
    "rainfall_7day"
]


def predict_heavy_rain(features):
    """
    Predict heavy rainfall using the trained CityLens ML model.
    """

    input_data = pd.DataFrame([{
        "month": features["month"],
        "day_of_year": features["day_of_year"],
        "rainfall_previous_day": features["rainfall_previous_day"],
        "rainfall_3day": features["rainfall_3day"],
        "rainfall_7day": features["rainfall_7day"]
    }])

    model = get_model()
    prediction = model.predict(input_data)[0]

    probabilities = model.predict_proba(input_data)[0]

    confidence = float(
        max(probabilities)
    )

    if prediction == 1:
        result = "HIGH"
    else:
        result = "LOW"

    return {
        "prediction": result,
        "confidence": round(confidence, 4)
    }