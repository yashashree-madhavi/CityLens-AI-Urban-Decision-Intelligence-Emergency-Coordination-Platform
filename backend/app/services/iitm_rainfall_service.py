import time
import json
import httpx

import math



IITM_BASE_URL = (
    "https://mumbairain.tropmet.res.in/json/map_file"
)


async def get_iitm_rainfall(period: str):
    endpoint_map = {
        "15min": ("read_map_15.php", 15),
        "1hr": ("read_map_1.php", 1),
        "3hr": ("read_map_3.php", 3),
    }

    if period not in endpoint_map:
        raise ValueError(
            "Invalid rainfall period"
        )

    endpoint, type_value = endpoint_map[period]

    url = f"{IITM_BASE_URL}/{endpoint}"

    params = {
        "type": type_value,
        "_": int(time.time() * 1000)
    }

    async with httpx.AsyncClient(
        verify=False
    ) as client:

        response = await client.get(
            url,
            params=params,
            timeout=20.0
        )

        response.raise_for_status()
        print(f"IITM {period} response headers:", dict(response.headers))
        

        import json

        json_start = response.text.find("[")

        if json_start == -1:
            raise ValueError(
                "IITM response does not contain JSON data"
            )

        json_text = response.text[json_start:]

        return json.loads(json_text)


async def get_nearest_iitm_rainfall(
    latitude: float,
    longitude: float,
):
    """
    Find the nearest IITM station and collect its rainfall
    for 15 minutes, 1 hour and 3 hours.

    This helper does not claim that the readings are fresh:
    the currently observed response has no timestamp.
    """
    periods = ["15min", "1hr", "3hr"]
    datasets = {}

    for period in periods:
        datasets[period] = await get_iitm_rainfall(period)

    def distance_km(lat1, lon1, lat2, lon2):
        radius = 6371.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(d_phi / 2) ** 2
            + math.cos(phi1)
            * math.cos(phi2)
            * math.sin(d_lambda / 2) ** 2
        )
        return 2 * radius * math.asin(math.sqrt(a))

    # Use the 15-minute dataset to identify the nearest station.
    candidates = []

    for station in datasets["15min"]:
        try:
            lat = float(station["lat"])
            lon = float(station["longitude"])
            distance = distance_km(
                latitude, longitude, lat, lon
            )
            candidates.append((distance, station))
        except (KeyError, TypeError, ValueError):
            continue

    if not candidates:
        raise ValueError("No valid IITM station coordinates found")

    distance, nearest = min(candidates, key=lambda item: item[0])

    station_name = nearest.get("stn_name") or nearest.get("stn_address")

    def find_matching_station(dataset):
        for station in dataset:
            if (
                station.get("stn_name") == nearest.get("stn_name")
                and station.get("stn_address") == nearest.get("stn_address")
            ):
                return station
        return None

    matched = {
        period: find_matching_station(datasets[period])
        for period in periods
    }

    if any(station is None for station in matched.values()):
        raise ValueError(
            "Nearest IITM station is missing from one or more rainfall periods"
        )

    return {
        "source": "IITM",
        "station_name": station_name,
        "latitude": float(nearest["lat"]),
        "longitude": float(nearest["longitude"]),
        "distance_km": round(distance, 2),
        "timestamp": None,
        "freshness_verified": False,
        "rainfall": {
            "rain_15min": float(matched["15min"]["rain"]),
            "rain_1hr": float(matched["1hr"]["rain"]),
            "rain_3hr": float(matched["3hr"]["rain"]),
            "rain_24hr": None,
        },
    }

if __name__ == "__main__":
    import asyncio

    async def test():
        for period in ["15min", "1hr", "3hr"]:
            try:
                data = await get_iitm_rainfall(period)

                print(
                    f"{period}: {len(data)} stations"
                )

                print(
                    "First station:",
                    data[0]
                )

            except Exception as e:
                print(
                    f"{period}: ERROR -> {e}"
                )

    asyncio.run(test())