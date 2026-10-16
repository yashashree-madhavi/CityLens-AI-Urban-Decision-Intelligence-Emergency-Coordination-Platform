
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix

from app.ai.prepare_dataset import prepare_dataset

FEATURES = [
    "month",
    "day_of_year",
    "rainfall_previous_day",
    "rainfall_3day",
    "rainfall_7day",
]
TARGET = "heavy_rain"


def report(name, y_true, predictions):
    tn, fp, fn, tp = confusion_matrix(
        y_true, predictions, labels=[0, 1]
    ).ravel()

    print(f"\n{name}")
    print("Precision:", round(
        precision_score(y_true, predictions, zero_division=0), 3
    ))
    print("Recall:", round(
        recall_score(y_true, predictions, zero_division=0), 3
    ))
    print("F1:", round(
        f1_score(y_true, predictions, zero_division=0), 3
    ))
    print(f"TP: {tp} | FN: {fn} | FP: {fp} | TN: {tn}")


def main():
    df = prepare_dataset()
    df["time"] = pd.to_datetime(df["time"])

    X = df[FEATURES]
    y = df[TARGET]

    train_end = int(len(df) * 0.70)
    val_end = int(len(df) * 0.80)

    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]

    test_dates = df["time"].iloc[val_end:]
    monsoon = test_dates.dt.month.isin([6, 7, 8, 9]).to_numpy()

    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            class_weight="balanced",
        ),
        "Logistic Regression": make_pipeline(
            StandardScaler(),
            LogisticRegression(
                class_weight="balanced",
                max_iter=2000,
                random_state=42,
            ),
        ),
    }

    print("Held-out test period:", test_dates.min(), "to", test_dates.max())
    print("Test rows:", len(y_test))
    print("Test heavy-rain days:", int(y_test.sum()))

    # Transparent seasonal baseline:
    # predict heavy rain on every day in June–September.
    seasonal_predictions = monsoon.astype(int)
    report(
        "Seasonal baseline: flag every June–September day",
        y_test.to_numpy(),
        seasonal_predictions,
    )

    for name, model in models.items():
        model.fit(X_train, y_train)

        # Select the decision threshold using validation data only.
        val_prob = model.predict_proba(X_val)[:, 1]
        best_threshold = 0.50
        best_f1 = -1

        for threshold in [0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]:
            val_pred = (val_prob >= threshold).astype(int)
            score = f1_score(y_val, val_pred, zero_division=0)

            if score > best_f1:
                best_f1 = score
                best_threshold = threshold

        test_prob = model.predict_proba(X_test)[:, 1]
        test_pred = (test_prob >= best_threshold).astype(int)

        print(f"\n{name} | threshold={best_threshold:.2f}")
        report("All test days", y_test.to_numpy(), test_pred)
        report(
            "Monsoon test days",
            y_test.to_numpy()[monsoon],
            test_pred[monsoon],
        )


if __name__ == "__main__":
    main()
