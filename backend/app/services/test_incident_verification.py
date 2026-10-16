
from incident_verification_service import assess_report


# Test 1: Missing photo should remain unverified.
result = assess_report(
    incident_type="pothole",
    description="Pothole near the junction",
    has_photo=False,
    location_valid=True,
)
assert result.verification_status == "unverified"
assert result.should_escalate is False


# Test 2: A possible duplicate should require review.
result = assess_report(
    incident_type="pothole",
    description="Pothole near the junction",
    has_photo=True,
    location_valid=True,
    duplicate_likely=True,
)
assert result.verification_status == "needs_review"


# Test 3: An urgent danger report should be escalated.
result = assess_report(
    incident_type="flood",
    description="A person is trapped in water",
    has_photo=False,
    location_valid=True,
)
assert result.should_escalate is True
assert result.emergency_priority == "critical"


# Test 4: A low-risk report with corroborating evidence
# may be automatically verified.
result = assess_report(
    incident_type="pothole",
    description="Pothole beside the junction",
    has_photo=True,
    location_valid=True,
    trusted_source_confirms=True,
    image_matches_category=True,
)
assert result.verification_status == "verified"


print("All 4 verification tests passed!")
