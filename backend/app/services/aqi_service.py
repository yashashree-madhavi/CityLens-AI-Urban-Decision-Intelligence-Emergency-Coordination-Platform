
import httpx

OPEN_METEO_AQI_URL = (
    "https://air-quality-api.open-meteo.com/v1/air-quality"
)


async def get_aqi(
    latitude: float,
    longitude: float
):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "pm10",
            "pm2_5",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "sulphur_dioxide",
            "ozone",
            "european_aqi",
            "us_aqi"
        ],
        "timezone": "Asia/Kolkata"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            OPEN_METEO_AQI_URL,
            params=params,
            timeout=15.0
        )
        response.raise_for_status()
        return response.json()


async def get_mumbai_aqi():
    return await get_aqi(
        latitude=19.0760,
        longitude=72.8777
    )

