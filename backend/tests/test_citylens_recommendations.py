from app.ai.resource_recommendation import recommend_resources


def test_medical_emergency():
    result = recommend_resources("medical")
    assert "AMBULANCE" in result["recommended_resources"]


def test_flood_critical():
    result = recommend_resources("flood", flood_risk="CRITICAL")
    assert "FLOOD_RESCUE_TEAM" in result["recommended_resources"]
    assert "EVACUATION_SUPPORT" in result["recommended_resources"]
    assert result["priority"] == "CRITICAL"


def test_fire_emergency():
    result = recommend_resources("fire")
    assert "FIRE_BRIGADE" in result["recommended_resources"]


def test_severe_traffic():
    result = recommend_resources("accident", traffic_level="SEVERE")
    assert "TRAFFIC_CONTROL_UNIT" in result["recommended_resources"]


def test_multiple_incidents():
    result = recommend_resources("medical", incident_count=3)
    assert "ADDITIONAL_FIELD_UNITS" in result["recommended_resources"]