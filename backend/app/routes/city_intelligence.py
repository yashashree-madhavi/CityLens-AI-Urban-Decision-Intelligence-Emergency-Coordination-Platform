
import asyncio

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.location import Location
from app.services.weather_service import get_weather
from app.services.aqi_service import get_aqi

router = APIRouter(
    prefix="/city-intelligence",
    tags=["City Intelligence"]
)


async def safe_fetch(coro):
    try:
        return await coro, None
    except Exception as exc:
        return None, type(exc).__name__


@router.get("/{location_id}")
async def get_location_intelligence(
    location_id: int,
    db: Session = Depends(get_db)
):
    location = (
        db.query(Location)
        .filter(
            Location.id == location_id,
            Location.is_active == True
        )
        .first()
    )

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Location not found or inactive"
        )

    latitude = location.latitude
    longitude = location.longitude

    weather_result, aqi_result = await asyncio.gather(
        safe_fetch(get_weather(latitude, longitude)),
        safe_fetch(get_aqi(latitude, longitude))
    )

    weather_data, weather_error = weather_result
    aqi_data, aqi_error = aqi_result

    weather_current = (
        weather_data.get("current", {})
        if weather_data else None
    )
    aqi_current = (
        aqi_data.get("current", {})
        if aqi_data else None
    )

    return {
        "location": {
            "id": location.id,
            "name": location.name,
            "latitude": latitude,
            "longitude": longitude
        },
        "weather": weather_current,
        "aqi": aqi_current,
        "sources": {
            "weather": "Open-Meteo",
            "aqi": "Open-Meteo Air Quality"
        },
        "observed_at": {
            "weather": (
                weather_current.get("time")
                if weather_current else None
            ),
            "aqi": (
                aqi_current.get("time")
                if aqi_current else None
            )
        },
        "data_status": {
            "weather": (
                "available" if weather_current
                else "unavailable"
            ),
            "aqi": (
                "available" if aqi_current
                else "unavailable"
            )
        },
        "errors": {
            "weather": weather_error,
            "aqi": aqi_error
        }
    }
