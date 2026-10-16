
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.aqi import AQIData
from app.services.aqi_service import get_aqi
from app.schemas.aqi import AQIResponse

router = APIRouter(
    prefix="/aqi",
    tags=["AQI"]
)


@router.get("/current", response_model=AQIResponse)
async def current_aqi(
    latitude: float = Query(19.0760, ge=-90, le=90),
    longitude: float = Query(72.8777, ge=-180, le=180),
    db: Session = Depends(get_db)
):
    try:
        aqi_data = await get_aqi(latitude, longitude)
        current = aqi_data["current"]

        record = AQIData(
            timestamp=datetime.fromisoformat(current["time"]),
            pm10=current.get("pm10"),
            pm2_5=current.get("pm2_5"),
            carbon_monoxide=current.get("carbon_monoxide"),
            nitrogen_dioxide=current.get("nitrogen_dioxide"),
            sulphur_dioxide=current.get("sulphur_dioxide"),
            ozone=current.get("ozone"),
            european_aqi=current.get("european_aqi"),
            us_aqi=current.get("us_aqi"),
            latitude=latitude,
            longitude=longitude
        )

        db.add(record)
        db.commit()

        return {
            "city": "Selected location",
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": current["time"],
            "pm10": current.get("pm10"),
            "pm2_5": current.get("pm2_5"),
            "carbon_monoxide": current.get("carbon_monoxide"),
            "nitrogen_dioxide": current.get("nitrogen_dioxide"),
            "sulphur_dioxide": current.get("sulphur_dioxide"),
            "ozone": current.get("ozone"),
            "european_aqi": current.get("european_aqi"),
            "us_aqi": current.get("us_aqi")
        }

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=f"Unable to fetch AQI data: {type(exc).__name__}"
        )
