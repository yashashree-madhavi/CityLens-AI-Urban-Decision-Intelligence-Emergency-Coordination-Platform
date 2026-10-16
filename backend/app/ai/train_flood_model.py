
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import f1_score, classification_report

from app.ai.prepare_dataset import prepare_dataset


FEATURES = [
    "month",
    "day_of_year",
    "rainfall_previous_day",
    "rainfall_3day",
    "rainfall_7day",
]
TARGET = "heavy_rain"
THRESHOLDS = [0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]

OUTPUT_DIR = Path("app/ai/artifacts")
MODEL_PATH = OUTPUT_DIR / "flood_model_candidate.joblib"
CONFIG_PATH = OUTPUT_DIR / "flood_model_candidate.json"


def choose_threshold(model, X_val, y_val):
    probabilities = model.predict_proba(X_val)[:, 1]
    results = []

    for threshold in THRESHOLDS:
        predictions = (probabilities >= threshold).astype(int)
        score = f1_score(y_val, predictions, zero_division=0)
        results.append((score, threshold))

    # Prefer the higher threshold when F1 scores tie.
    return max(results, key=lambda item: (item[0], item[1]))


def main():
    df = prepare_dataset()

    # Keep this experiment consistent with the cleaned feature dataset.
    X = df[FEATURES]
    y = df[TARGET]

    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.80)

    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]

    candidates = {
        "random_forest": RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            class_weight="balanced",
        ),
        "logistic_regression": make_pipeline(
            StandardScaler(),
            LogisticRegression(
                class_weight="balanced",
                max_iter=2000,
                random_state=42,
            ),
        ),
    }

    results = []

    for name, model in candidates.items():
        model.fit(X_train, y_train)
        val_f1, threshold = choose_threshold(model, X_val, y_val)

        results.append({
            "name": name,
            "model": model,
            "threshold": threshold,
            "validation_f1": val_f1,
        })

        print(
            f"{name}: validation F1={val_f1:.3f}, "
            f"threshold={threshold:.2f}"
        )

    # Choose the model using validation results only.
    best = max(
        results,
        key=lambda item: (item["validation_f1"], item["name"]),
    )

    test_probabilities = best["model"].predict_proba(X_test)[:, 1]
    test_predictions = (
        test_probabilities >= best["threshold"]
    ).astype(int)

    print(f"\nSelected candidate: {best['name']}")
    print(f"Threshold: {best['threshold']:.2f}")
    print("\nFinal held-out test report:")
    print(classification_report(
        y_test,
        test_predictions,
        labels=[0, 1],
        target_names=["Normal Rain", "Heavy Rain"],
        zero_division=0,
    ))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best["model"], MODEL_PATH)

    config = {
        "model_name": best["name"],
        "features": FEATURES,
        "target": TARGET,
        "threshold": best["threshold"],
        "validation_f1": round(best["validation_f1"], 4),
        "training_rows": len(X_train),
        "validation_rows": len(X_val),
        "test_rows": len(X_test),
        "rainfall_threshold_mm": 50,
        "warning": (
            "Experimental daily heavy-rain classifier; "
            "not a validated flood predictor."
        ),
    }

    CONFIG_PATH.write_text(
        json.dumps(config, indent=2),
        encoding="utf-8",
    )

    print(f"\nCandidate model saved to: {MODEL_PATH}")
    print(f"Configuration saved to: {CONFIG_PATH}")


if __name__ == "__main__":
    main()
