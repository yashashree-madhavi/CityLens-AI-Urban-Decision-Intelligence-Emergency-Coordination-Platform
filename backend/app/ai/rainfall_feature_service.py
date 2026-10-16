
from datetime import date, datetime

import pandas as pd


REQUIRED_COLUMNS = ["date", "rainfall_mm"]


def build_latest_features(observations: list[dict]) -> dict:
    """
    Build model features from consecutive daily rainfall observations.

    Each observation must contain:
      - date: YYYY-MM-DD
      - rainfall_mm: observed daily rainfall total in millimetres

    Missing dates or rainfall values are rejected rather than treated as zero.
    The latest date must be today or yesterday to avoid using stale history.
    """
    if not observations:
        raise ValueError("No daily rainfall observations supplied.")

    df = pd.DataFrame(observations)

    missing_columns = [
        column for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]
    if missing_columns:
        raise ValueError(
            "Missing columns: " + ", ".join(missing_columns)
        )

    df = df[REQUIRED_COLUMNS].copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["rainfall_mm"] = pd.to_numeric(
        df["rainfall_mm"], errors="coerce"
    )

    if df["date"].isna().any() or df["rainfall_mm"].isna().any():
        raise ValueError(
            "Dates and rainfall values must be present and valid."
        )

    df["date"] = df["date"].dt.normalize()
    df = df.sort_values("date")

    if df["date"].duplicated().any():
        raise ValueError("Duplicate daily rainfall dates found.")

    if (df["rainfall_mm"] < 0).any():
        raise ValueError("Rainfall values cannot be negative.")

    df = df.set_index("date").asfreq("D")

    if df["rainfall_mm"].isna().any():
        raise ValueError(
            "Daily rainfall history contains missing dates. "
            "Do not fill missing rainfall with zero."
        )

    latest_date = df.index[-1].date()
    today = date.today()

    if (today - latest_date).days not in (0, 1):
        raise ValueError(
            "Daily rainfall history is stale. Latest observation: "
            f"{latest_date.isoformat()}"
        )

    if len(df) < 8:
        raise ValueError(
            "At least 8 consecutive daily observations are required."
        )

    # Prediction is for the latest date; rainfall history ends the day before.
    history = df["rainfall_mm"]
    previous_day = float(history.iloc[-2])
    previous_3day = float(history.iloc[-4:-1].sum())
    previous_7day = float(history.iloc[-8:-1].sum())

    latest = df.index[-1]

    return {
        "month": int(latest.month),
        "day_of_year": int(latest.dayofyear),
        "rainfall_previous_day": previous_day,
        "rainfall_3day": previous_3day,
        "rainfall_7day": previous_7day,
    }
