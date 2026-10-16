
import pandas as pd

DATASET_PATH = "Mumbai_1990_2022_Santacruz.csv"


def prepare_dataset():
    df = pd.read_csv(DATASET_PATH)

    df["time"] = pd.to_datetime(
        df["time"],
        dayfirst=True,
        errors="coerce"
    )

    df = (
        df.dropna(subset=["time"])
        .sort_values("time")
        .drop_duplicates(subset=["time"])
        .set_index("time")
        .asfreq("D")
    )

    # Keep missing rainfall values as NaN.
    # Never assume missing rainfall means zero.
    df["prcp"] = pd.to_numeric(df["prcp"], errors="coerce")

    # Build history from actual consecutive calendar days.
    df["month"] = df.index.month
    df["day_of_year"] = df.index.dayofyear

    df["rainfall_previous_day"] = df["prcp"].shift(1)
    df["rainfall_3day"] = df["prcp"].shift(1).rolling(
        window=3, min_periods=3
    ).sum()
    df["rainfall_7day"] = df["prcp"].shift(1).rolling(
        window=7, min_periods=7
    ).sum()

    # Only observed rainfall can define the target.
    df["heavy_rain"] = (df["prcp"] >= 50).astype("Int64")
    df.loc[df["prcp"].isna(), "heavy_rain"] = pd.NA

    # Remove samples with missing targets or incomplete history.
    required = [
        "heavy_rain",
        "rainfall_previous_day",
        "rainfall_3day",
        "rainfall_7day",
    ]

    df = df.dropna(subset=required).copy()
    df["heavy_rain"] = df["heavy_rain"].astype(int)

    return df.reset_index()


if __name__ == "__main__":
    df = prepare_dataset()

    print("Usable rows:", len(df))
    print("Date range:", df["time"].min(), "to", df["time"].max())
    print("Target distribution:")
    print(df["heavy_rain"].value_counts().sort_index())
    print("Missing required features:")
    print(
        df[
            [
                "rainfall_previous_day",
                "rainfall_3day",
                "rainfall_7day",
            ]
        ].isna().sum()
    )
