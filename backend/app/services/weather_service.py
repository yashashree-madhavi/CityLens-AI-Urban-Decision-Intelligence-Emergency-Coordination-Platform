import httpx


OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


async def get_weather(
    latitude: float,
    longitude: float
):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "rain",
            "weather_code",
            "wind_speed_10m"
        ],
        "timezone": "Asia/Kolkata"
    }

    async with httpx.AsyncClient() as client:

        response = await client.get(
            OPEN_METEO_URL,
            params=params,
            timeout=10.0
        )

        response.raise_for_status()

        return response.json()


async def get_weather_for_locations(locations):
    """
    Fetch current weather for multiple locations
    using a single Open-Meteo API request.
    """

    if not locations:
        return []

    latitudes = ",".join(
        str(location.latitude)
        for location in locations
    )

    longitudes = ",".join(
        str(location.longitude)
        for location in locations
    )

    params = {
        "latitude": latitudes,
        "longitude": longitudes,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "precipitation",
            "rain",
            "weather_code",
            "wind_speed_10m"
        ],
        "timezone": "Asia/Kolkata"
    }

    async with httpx.AsyncClient() as client:

        response = await client.get(
            OPEN_METEO_URL,
            params=params,
            timeout=30.0
        )

        response.raise_for_status()

        return response.json()

async def get_rainfall_forecast(
    latitude: float,
    longitude: float,
    location_name: str = "Selected area",
):
    """
    Get upcoming hourly rainfall forecasts for a location
    using Open-Meteo.
    """

    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": [
            "precipitation_probability",
            "precipitation",
            "rain",
            "weather_code",
        ],
        "forecast_hours": 6,
        "timezone": "Asia/Kolkata",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            OPEN_METEO_URL,
            params=params,
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()

    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    probabilities = hourly.get("precipitation_probability", [])
    precipitation = hourly.get("precipitation", [])
    rain = hourly.get("rain", [])
    weather_codes = hourly.get("weather_code", [])

    forecasts = []

    for index, timestamp in enumerate(times):
        probability = probabilities[index] if index < len(probabilities) else None
        amount = precipitation[index] if index < len(precipitation) else None
        rain_amount = rain[index] if index < len(rain) else None
        weather_code = weather_codes[index] if index < len(weather_codes) else None

        if probability is None or amount is None:
            continue

        forecasts.append({
            "location": location_name,
            "forecast_time": timestamp,
            "precipitation_probability": probability,
            "precipitation_mm": amount,
            "rain_mm": rain_amount,
            "weather_code": weather_code,
        })

    rainy_forecasts = [
        item for item in forecasts
        if item["precipitation_probability"] >= 50
        and item["precipitation_mm"] > 0
    ]

    next_rain = rainy_forecasts[0] if rainy_forecasts else None

    return {
        "location": location_name,
        "forecast_provider": "Open-Meteo",
        "forecast_type": "hourly_rainfall",
        "next_rain": next_rain,
        "hourly_forecasts": forecasts,
    }