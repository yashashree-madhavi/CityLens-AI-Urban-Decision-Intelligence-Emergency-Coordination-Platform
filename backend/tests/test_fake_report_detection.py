
from types import SimpleNamespace

from app.ai.fake_report_detection import (
    build_incident_features,
    detect_suspicious_report,
)


def make_incident(description, latitude, longitude):
    return SimpleNamespace(
        description=description,
        latitude=latitude,
        longitude=longitude,
    )


def test_insufficient_historical_data():
    incidents = [
        make_incident("Pothole", 19.07, 72.87)
        for _ in range(4)
    ]

    new_incident = make_incident(
        "Road damage", 19.08, 72.88
    )

    result = detect_suspicious_report(
        incidents, new_incident
    )

    assert result["classification"] == "INSUFFICIENT_DATA"
    assert result["suspicion_score"] == 0
    assert result["anomaly_score"] is None


def test_feature_extraction():
    incidents = [
        make_incident("Pothole reported", 19.07, 72.87),
        make_incident("Waterlogging", 19.08, 72.88),
    ]

    features = build_incident_features(incidents)

    assert features.shape == (2, 3)
    assert features[0][0] == len("Pothole reported")
    assert features[0][1] == 19.07
    assert features[0][2] == 72.87


def test_normal_report_returns_valid_structure():
    incidents = [
        make_incident("Pothole near road", 19.07 + i * 0.001, 72.87 + i * 0.001)
        for i in range(10)
    ]

    new_incident = make_incident(
        "Pothole near junction", 19.074, 72.874
    )

    result = detect_suspicious_report(
        incidents, new_incident
    )

    assert result["classification"] in ["NORMAL", "SUSPICIOUS"]
    assert 0 <= result["suspicion_score"] <= 100
    assert isinstance(result["anomaly_score"], float)
    assert isinstance(result["reason"], str)


def test_suspicion_score_is_within_range():
    incidents = [
        make_incident("Road issue", 19.07 + i * 0.001, 72.87 + i * 0.001)
        for i in range(10)
    ]

    new_incident = make_incident(
        "Unusual report", 19.50, 73.50
    )

    result = detect_suspicious_report(
        incidents, new_incident
    )

    assert 0 <= result["suspicion_score"] <= 100


def test_detection_is_reproducible():
    incidents = [
        make_incident("Road damage", 19.07 + i * 0.001, 72.87 + i * 0.001)
        for i in range(10)
    ]

    new_incident = make_incident(
        "Pothole near road", 19.074, 72.874
    )

    result1 = detect_suspicious_report(
        incidents, new_incident
    )

    result2 = detect_suspicious_report(
        incidents, new_incident
    )

    assert result1 == result2
