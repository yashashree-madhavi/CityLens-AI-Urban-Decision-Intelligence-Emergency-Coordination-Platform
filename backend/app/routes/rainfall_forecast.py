from fastapi import APIRouter, HTTPException, Query

from app.services.weather_service import get_rainfall_forecast

router = APIRouter(
    prefix="/rainfall",
    tags=["Rainfall Forecast"],
)


@router.get("/forecast")
async def rainfall_forecast(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    location_name: str = Query(
        "Selected area",
        min_length=1,
        max_length=120,
    ),
):
    try:
        return await get_rainfall_forecast(
            latitude=latitude,
            longitude=longitude,
            location_name=location_name,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not retrieve the rainfall forecast.",
        ) from exc