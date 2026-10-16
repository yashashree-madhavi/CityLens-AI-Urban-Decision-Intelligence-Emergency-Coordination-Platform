
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ai.flood_prediction import predict_heavy_rain as predict_legacy
from app.ai.flood_forecast_service import forecast_heavy_rain

router = APIRouter(
    prefix="/ml",
    tags=["ML Prediction"]
)


class DailyRainfallObservation(BaseModel):
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    rainfall_mm: float = Field(..., ge=0)


class FloodForecastRequest(BaseModel):
    observations: list[DailyRainfallObservation] = Field(..., min_length=8)


# Existing endpoint — preserve its interface
@router.post("/flood-prediction")
def flood_prediction(
    month: int,
    day_of_year: int,
    rainfall_previous_day: float,
    rainfall_3day: float,
    rainfall_7day: float
):
    prediction = predict_legacy({
        "month": month,
        "day_of_year": day_of_year,
        "rainfall_previous_day": rainfall_previous_day,
        "rainfall_3day": rainfall_3day,
        "rainfall_7day": rainfall_7day
    })

    return {
        "model": "Mumbai Heavy Rainfall Prediction",
        "prediction": prediction
    }


# New endpoint — uses the trained candidate model
@router.post("/flood-forecast")
def flood_forecast(request: FloodForecastRequest):
    observations = [
        item.model_dump()
        for item in request.observations
    ]

    return {
        "model": "Mumbai Heavy Rainfall ML Forecast",
        **forecast_heavy_rain(observations)
    }
