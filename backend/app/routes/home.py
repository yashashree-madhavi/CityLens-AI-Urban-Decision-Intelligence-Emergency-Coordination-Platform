from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.bmc_weather import BMCWeatherData
from app.services.aqi_service import get_aqi
from app.services.weather_service import get_weather
from app.services.traffic_service import get_traffic
from app.services.flood_risk_service import calculate_flood_risk

router = APIRouter(
    prefix="/home",
    tags=["Citizen Home"]
)


def _aqi_label(us_aqi):
    if us_aqi is None:
        return "Unknown"
    if us_aqi <= 50:
        return "Good"
    if us_aqi <= 100:
        return "Moderate"
    if us_aqi <= 150:
        return "Unhealthy for sensitive"
    if us_aqi <= 200:
        return "Unhealthy"
    return "Very unhealthy"


@router.get("/summary")
async def home_summary(
    latitude: float = Query(19.0760),
    longitude: float = Query(72.8777),
    db: Session = Depends(get_db)
):
    """
    One call for the citizen Home screen.
    Each part is independent: if one external API fails,
    that part is null and the rest still works.
    """
    result = {
        "weather": None,
        "aqi": None,
        "traffic": None,
        "flood_risk": None
    }

    # ---- Weather
    try:
        data = await get_weather(latitude, longitude)
        current = data["current"]
        result["weather"] = {
            "temperature": current["temperature_2m"],
            "apparent_temperature": current["apparent_temperature"],
            "humidity": current["relative_humidity_2m"],
            "rain": current["rain"],
            "wind_speed": current["wind_speed_10m"],
            "weather_code": current["weather_code"],
            "timestamp": current.get("time"),
            "latitude": latitude,
            "longitude": longitude,
            "source": "Open-Meteo"
        }
    except Exception:
        pass

    
    # ---- Air quality for the requested coordinates
    try:
        data = await get_aqi(latitude, longitude)
        current = data["current"]
        us_aqi = current.get("us_aqi")

        result["aqi"] = {
            "us_aqi": us_aqi,
            "label": _aqi_label(us_aqi),
            "pm2_5": current.get("pm2_5"),
            "pm10": current.get("pm10"),
            "timestamp": current.get("time"),
            "latitude": latitude,
            "longitude": longitude,
            "source": "Open-Meteo Air Quality"
        }
    except Exception:
        pass


    # ---- Traffic
    try:
        traffic = await get_traffic(latitude, longitude)
        result["traffic"] = {
            "congestion_level": traffic["congestion_level"],
            "congestion_percentage": traffic["congestion_percentage"],
            "current_speed": traffic["current_speed"],
            "free_flow_speed": traffic["free_flow_speed"],
            "road_closure": traffic["road_closure"]
        }
    except Exception:
        pass

    # ---- Flood risk (nearest BMC station that has data)
    try:
        stations = db.query(BMCWeatherData).all()
        nearest = None
        nearest_distance = None

        for station in stations:
            distance = (
                (station.latitude - latitude) ** 2
                + (station.longitude - longitude) ** 2
            )
            if nearest_distance is None or distance < nearest_distance:
                nearest_distance = distance
                nearest = station

        if nearest:
            risk = calculate_flood_risk(db, nearest.bmc_location_id)
            if risk:
                result["flood_risk"] = {
                    "station_name": risk["station_name"],
                    "risk_level": risk["risk_level"],
                    "risk_score": risk["risk_score"],
                    "data_status": risk["data_status"],
                    "reasons": risk["reasons"][:3]
                }
    except Exception:
        pass

    return result
