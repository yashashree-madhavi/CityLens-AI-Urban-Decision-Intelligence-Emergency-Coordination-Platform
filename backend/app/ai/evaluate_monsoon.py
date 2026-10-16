
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
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

FEATURES = [
    "month",
    "day_of_year",
    "rainfall_previous_day",
    "rainfall_3day",
    "rainfall_7day",
]
TARGET = "heavy_rain"


def report_period(name, y_true, probabilities, threshold):
    predictions = (probabilities >= threshold).astype(int)

    tn, fp, fn, tp = confusion_matrix(
        y_true, predictions, labels=[0, 1]
    ).ravel()

    print(f"\n{name}")
    print("Days:", len(y_true))
    print("Actual heavy-rain days:", int(y_true.sum()))
    print("Precision:", round(
        precision_score(y_true, predictions, zero_division=0), 3
    ))
    print("Recall:", round(
        recall_score(y_true, predictions, zero_division=0), 3
    ))
    print("F1:", round(
        f1_score(y_true, predictions, zero_division=0), 3
    ))
    print(f"True positives: {tp} | Missed: {fn} | False alarms: {fp} | True negatives: {tn}")


def main():
    df = prepare_dataset()
    X = df[FEATURES]
    y = df[TARGET]

    # Keep the same chronological split used in the model comparison.
    train_end = int(len(df) * 0.70)
    val_end = int(len(df) * 0.80)

    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:].copy(), y.iloc[val_end:].copy()

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

    test_dates = pd.to_datetime(df["time"].iloc[val_end:])
    monsoon = test_dates.dt.month.isin([6, 7, 8, 9])

    print("Held-out test period:", test_dates.min(), "to", test_dates.max())
    print("Monsoon months: June–September")
    print("Thresholds selected on validation data only.")

    for name, model in models.items():
        model.fit(X_train, y_train)

        val_prob = model.predict_proba(X_val)[:, 1]
        best_threshold = 0.50
        best_f1 = -1

        # Choose the threshold using validation data, not test data.
        for threshold in [0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]:
            val_pred = (val_prob >= threshold).astype(int)
            score = f1_score(y_val, val_pred, zero_division=0)

            if score > best_f1:
                best_f1 = score
                best_threshold = threshold

        test_prob = model.predict_proba(X_test)[:, 1]

        print(f"\n{'=' * 60}")
        print(name)
        print("Validation-selected threshold:", best_threshold)
        print("Validation F1:", round(best_f1, 3))

        report_period(
            "MONSOON (June–September)",
            y_test.loc[monsoon].to_numpy(),
            test_prob[monsoon.to_numpy()],
            best_threshold,
        )
        report_period(
            "NON-MONSOON (October–May)",
            y_test.loc[~monsoon].to_numpy(),
            test_prob[(~monsoon).to_numpy()],
            best_threshold,
        )


if __name__ == "__main__":
    main()
