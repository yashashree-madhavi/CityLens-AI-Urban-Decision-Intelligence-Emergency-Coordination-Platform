
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

from app.ai.prepare_dataset import prepare_dataset

BASE_FEATURES = [
    "month",
    "day_of_year",
    "rainfall_previous_day",
    "rainfall_3day",
    "rainfall_7day",
]

TEMP_FEATURES = ["tavg", "tmin", "tmax"]
TARGET = "heavy_rain"
THRESHOLDS = [0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]


def evaluate(name, features, train, val, test):
    X_train, y_train = train[features], train[TARGET]
    X_val, y_val = val[features], val[TARGET]
    X_test, y_test = test[features], test[TARGET]

    model = make_pipeline(
        StandardScaler(),
        LogisticRegression(
            class_weight="balanced",
            max_iter=2000,
            random_state=42,
        ),
    )
    model.fit(X_train, y_train)

    val_prob = model.predict_proba(X_val)[:, 1]
    best_threshold = 0.50
    best_f1 = -1

    for threshold in THRESHOLDS:
        pred = (val_prob >= threshold).astype(int)
        score = f1_score(y_val, pred, zero_division=0)

        if score > best_f1:
            best_f1 = score
            best_threshold = threshold

    test_prob = model.predict_proba(X_test)[:, 1]
    test_pred = (test_prob >= best_threshold).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_test, test_pred, labels=[0, 1]
    ).ravel()

    print(f"\n{name}")
    print("Features:", features)
    print("Validation-selected threshold:", best_threshold)
    print("Validation F1:", round(best_f1, 3))
    print("Test precision:", round(
        precision_score(y_test, test_pred, zero_division=0), 3
    ))
    print("Test recall:", round(
        recall_score(y_test, test_pred, zero_division=0), 3
    ))
    print("Test F1:", round(
        f1_score(y_test, test_pred, zero_division=0), 3
    ))
    print(f"TP: {tp} | FN: {fn} | FP: {fp} | TN: {tn}")



def main():
    df = prepare_dataset()
    df["time"] = pd.to_datetime(df["time"])

    # Compare both models on exactly the same complete rows.
    required = BASE_FEATURES + TEMP_FEATURES + [TARGET]
    complete = df.dropna(subset=required).copy()

    train_end = int(len(complete) * 0.70)
    val_end = int(len(complete) * 0.80)

    train = complete.iloc[:train_end]
    val = complete.iloc[train_end:val_end]
    test = complete.iloc[val_end:]

    print("\nFair comparison: identical rows for both models")
    print("Test period:", test["time"].min(), "to", test["time"].max())
    print("Test rows:", len(test))
    print("Test heavy-rain days:", int(test[TARGET].sum()))

    evaluate(
        "Model A: Existing features (same rows)",
        BASE_FEATURES,
        train, val, test,
    )

    evaluate(
        "Model B: Existing features + temperature (same rows)",
        BASE_FEATURES + TEMP_FEATURES,
        train, val, test,
    )


if __name__ == "__main__":
    main()
