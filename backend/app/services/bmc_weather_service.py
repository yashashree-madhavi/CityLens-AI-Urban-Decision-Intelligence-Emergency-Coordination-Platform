import httpx
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from app.models.bmc_weather import BMCWeatherData

BMC_SUBLOCATION_URL = (
    "https://dmwebtwo.mcgm.gov.in/"
    "api/sublocation/loadAll"
)

BMC_WEATHER_URL = (
    "https://dmwebtwo.mcgm.gov.in/"
    "api/tabWeatherForecastData/loadById"
)



async def get_bmc_weather(location_id: int):
    """Fetch weather data for one BMC AWS station."""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            BMC_WEATHER_URL,
            json={"id": location_id},
            timeout=15.0,
        )
        response.raise_for_status()
        data = response.json()

    location = data.get("locationList") or {}
    weather = data.get("dummyTestRaingaugeDataDetails") or {}

    def parse_number(value):
        """Return None for missing or invalid numeric values."""
        if value is None or value == "":
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    return {
        "bmc_location_id": location.get("id"),
        "station_name": location.get("description"),
        "latitude": parse_number(location.get("lati")),
        "longitude": parse_number(location.get("longi")),
        "timestamp": weather.get("timerecorded"),

        "temperature": parse_number(weather.get("tempOut")),
        "humidity": parse_number(weather.get("outHumidity")),
        "wind_speed": parse_number(weather.get("windSpeed")),
        "wind_direction": weather.get("windDir"),
        "pressure": parse_number(weather.get("bar")),

        "rain_15min": parse_number(weather.get("rain")),
        "rain_rate": parse_number(weather.get("rainRate")),
        "rain_1hr": parse_number(data.get("avgRainOneHourAWS")),
        "rain_3hr": parse_number(data.get("avgRainThreeHourAWS")),
        "rain_6hr": parse_number(data.get("avgRainSixHourAWS")),
        "rain_12hr": parse_number(data.get("avgRainTwelveHourAWS")),
        "rain_24hr": parse_number(data.get("avgRainTwentyFourHourAWS")),
    }

async def get_bmc_location_ids():
    """
    Get all unique BMC AWS location IDs.
    """

    async with httpx.AsyncClient() as client:
        response = await client.post(
            BMC_SUBLOCATION_URL,
            json={},
            timeout=15.0
        )

        response.raise_for_status()

        locations = response.json()

    location_ids = sorted(
        {
            item["locationid"]
            for item in locations
            if item.get("locationid") is not None
        }
    )

    return location_ids




async def collect_all_bmc_weather(db: Session):
    """Collect BMC observations without failing on duplicates."""
    location_ids = await get_bmc_location_ids()

    print(
        f"Starting BMC weather collection for "
        f"{len(location_ids)} AWS stations..."
    )

    inserted = 0
    skipped = 0
    failed = 0

    for location_id in location_ids:
        try:
            observation = await get_bmc_weather(location_id)

            timestamp_value = observation.get("timestamp")
            if not timestamp_value:
                raise ValueError("Missing BMC weather timestamp")

            timestamp = datetime.strptime(
                timestamp_value.split(".")[0],
                "%Y-%m-%d %H:%M:%S",
            )

            
            station_id = observation.get("bmc_location_id")
            if station_id is None:
                raise ValueError("Missing BMC station ID")

            if observation.get("latitude") is None:
                raise ValueError("Missing BMC station latitude")

            if observation.get("longitude") is None:
                raise ValueError("Missing BMC station longitude")


            observation["timestamp"] = timestamp
          
            latest_timestamp = (
                db.query(BMCWeatherData.timestamp)
                .filter(
                    BMCWeatherData.bmc_location_id == station_id
                )
                .order_by(BMCWeatherData.timestamp.desc())
                .first()
            )

            if latest_timestamp:
                latest_timestamp = latest_timestamp[0]

                # Normalize both timestamps before comparison.
                if latest_timestamp.tzinfo is not None:
                    latest_timestamp = latest_timestamp.replace(tzinfo=None)

                if timestamp < latest_timestamp:
                    skipped += 1
                    print(
                        f"Skipping older observation for station {station_id}: "
                        f"{timestamp} < {latest_timestamp}"
                    )
                    continue

            statement = (
                insert(BMCWeatherData)
                .values(**observation)
                .on_conflict_do_nothing(
                    constraint="uq_bmc_weather_station_timestamp"
                )
                .returning(BMCWeatherData.id)
            )

            result = db.execute(statement)
            if result.scalar_one_or_none() is not None:
                inserted += 1
            else:
                skipped += 1

        except Exception as exc:
            db.rollback()
            failed += 1
            print(f"BMC station {location_id} failed: {exc}")

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        print(f"BMC weather commit failed: {exc}")
        raise

    summary = {
        "total_stations": len(location_ids),
        "inserted": inserted,
        "skipped_duplicates": skipped,
        "failed": failed,
    }

    print("BMC weather collection completed:", summary)
    return summary
