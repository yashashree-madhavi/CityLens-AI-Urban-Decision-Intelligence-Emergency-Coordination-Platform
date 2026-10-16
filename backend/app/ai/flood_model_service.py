
import json
from pathlib import Path

import joblib
import pandas as pd


AI_DIR = Path(__file__).resolve().parent
MODEL_PATH = AI_DIR / "artifacts" / "flood_model_candidate.joblib"
CONFIG_PATH = AI_DIR / "artifacts" / "flood_model_candidate.json"


def load_model():
    if not MODEL_PATH.exists() or not CONFIG_PATH.exists():
        raise FileNotFoundError(
            "Flood model artifacts are missing. "
            "Run: python -m app.ai.train_flood_model"
        )

    model = joblib.load(MODEL_PATH)

    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        config = json.load(file)

    return model, config


def predict_heavy_rain(features: dict) -> dict:
    model, config = load_model()
    required_features = config["features"]

    missing = [
        name for name in required_features
        if name not in features or features[name] is None
    ]

    if missing:
        raise ValueError(
            "Missing required model features: " + ", ".join(missing)
        )

    input_frame = pd.DataFrame(
        [{name: float(features[name]) for name in required_features}],
        columns=required_features,
    )

    probabilities = model.predict_proba(input_frame)[0]
    classes = list(model.classes_)
    heavy_index = classes.index(1)
    probability = float(probabilities[heavy_index])

    threshold = float(config["threshold"])
    prediction = "HIGH" if probability >= threshold else "LOW"

    return {
        "prediction": prediction,
        "heavy_rain_probability": round(probability, 4),
        "threshold": threshold,
        "model_name": config["model_name"],
        "target": config["target"],
        "warning": config["warning"],
    }
