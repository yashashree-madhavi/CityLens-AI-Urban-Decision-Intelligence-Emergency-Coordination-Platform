
import logging
import math

import httpx


logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
DEFAULT_RADIUS_METERS = 5000


def calculate_distance_meters(lat1, lon1, lat2, lon2):
    """Calculate straight-line distance using the Haversine formula."""
    earth_radius = 6_371_000

    lat1, lon1, lat2, lon2 = map(
        math.radians, [lat1, lon1, lat2, lon2]
    )

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )

    return earth_radius * 2 * math.atan2(
        math.sqrt(a), math.sqrt(max(0.0, 1 - a))
    )


def _demo_services(latitude, longitude, radius_meters):
    """Synthetic facilities for a clearly labelled review demonstration."""
    examples = [
        ("Demo City Hospital", "hospital", 0.006, 0.004),
        ("Demo Fire Station", "fire_station", -0.008, 0.003),
        ("Demo Police Station", "police", 0.003, -0.009),
        ("Demo Ambulance Unit", "ambulance", -0.004, -0.005),
    ]

    results = []

    for name, service_type, dlat, dlon in examples:
        lat = latitude + dlat
        lon = longitude + dlon
        distance = calculate_distance_meters(
            latitude, longitude, lat, lon
        )

        if distance <= radius_meters:
            results.append({
                "name": name,
                "service_type": service_type,
                "latitude": lat,
                "longitude": lon,
                "distance_meters": round(distance),
                "source": "demo",
                "demo_only": True,
            })

    return sorted(results, key=lambda item: item["distance_meters"])


async def find_nearby_emergency_services(
    latitude: float,
    longitude: float,
    radius_meters: int = DEFAULT_RADIUS_METERS,
):
    """Find mapped services, falling back to labelled demo data."""

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("Invalid latitude or longitude")

    if not 100 <= radius_meters <= 20000:
        raise ValueError("Radius must be between 100 and 20000 metres")

    query = f"""
    [out:json][timeout:20];
    (
      nwr(around:{radius_meters},{latitude},{longitude})
        ["amenity"~"^(hospital|police|fire_station)$"];
      nwr(around:{radius_meters},{latitude},{longitude})
        ["emergency"="ambulance_station"];
    );
    out center tags;
    """

    try:
        async with httpx.AsyncClient(
            timeout=25.0,
            headers={"User-Agent": "CityLensAI/1.0"},
        ) as client:
            response = await client.post(
                OVERPASS_URL,
                data={"data": query},
            )
            response.raise_for_status()
            elements = response.json().get("elements", [])

        results = []
        seen = set()

        for element in elements:
            tags = element.get("tags", {})
            name = tags.get("name:en") or tags.get("name")

            lat = element.get("lat")
            lon = element.get("lon")

            if lat is None or lon is None:
                center = element.get("center", {})
                lat = center.get("lat")
                lon = center.get("lon")

            if not name or lat is None or lon is None:
                continue

            amenity = tags.get("amenity")
            service_type = (
                "ambulance"
                if tags.get("emergency") == "ambulance_station"
                else amenity
            )

            if service_type not in {
                "hospital", "police", "fire_station", "ambulance"
            }:
                continue

            distance = calculate_distance_meters(
                latitude, longitude, lat, lon
            )

            if distance > radius_meters:
                continue

            # Avoid duplicate entries returned by overlapping OSM elements.
            key = (service_type, name.strip().lower())

            if key in seen:
                continue

            seen.add(key)

            results.append({
                "name": name,
                "service_type": service_type,
                "latitude": lat,
                "longitude": lon,
                "distance_meters": round(distance),
                "source": "openstreetmap",
                "demo_only": False,
            })

        if results:
            return {
                "services": sorted(
                    results, key=lambda item: item["distance_meters"]
                ),
                "source": "openstreetmap",
                "demo_only": False,
            }

        logger.warning(
            "No mapped emergency services found; using demo facilities."
        )

    except (httpx.HTTPError, ValueError, KeyError) as exc:
        logger.warning("Emergency-service lookup failed: %s", exc)

    return {
        "services": _demo_services(
            latitude, longitude, radius_meters
        ),
        "source": "demo",
        "demo_only": True,
    }
