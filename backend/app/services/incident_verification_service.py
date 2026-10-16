
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class VerificationDecision:
    verification_status: str
    verification_method: str
    verification_reason: str
    emergency_priority: str
    should_escalate: bool


# These categories require conservative handling.
HIGH_RISK_TYPES = {
    "flood",
    "flooding",
    "accident",
    "fire",
    "road blockage",
    "road_blockage",
}

LOW_RISK_TYPES = {
    "pothole",
    "streetlight",
    "broken streetlight",
    "road damage",
}

URGENT_PHRASES = (
    "person trapped",
    "trapped in water",
    "serious injury",
    "life-threatening",
    "life threatening",
    "building collapse",
    "live electric wire",
    "fire spreading",
)


def assess_report(
    incident_type: str,
    description: Optional[str],
    has_photo: bool,
    location_valid: bool,
    *,
    trusted_source_confirms: bool = False,
    image_matches_category: Optional[bool] = None,
    duplicate_likely: bool = False,
    urgent_danger_reported: bool = False,
    weather_context: Optional[dict] = None,
) -> VerificationDecision:
    """
    Decide which workflow a report should enter.

    This is an explainable decision-intelligence assessment.
    Do not mark a report verified unless the evidence signals
    supplied by the caller were actually checked.
    Do not treat clear weather as proof that a flood report is false,
    since waterlogging can persist after rainfall or from blocked drains.
    """

    category = (incident_type or "").strip().lower()
    text = (description or "").strip().lower()

    urgent = urgent_danger_reported or any(
        phrase in text for phrase in URGENT_PHRASES
    )

    # Emergency escalation must not wait for verification.
    if urgent:
        return VerificationDecision(
            verification_status="verifying",
            verification_method="emergency_triage",
            verification_reason=(
                "Urgent danger reported. Escalate immediately "
                "while verification continues."
            ),
            emergency_priority="critical",
            should_escalate=True,
        )

    if not text or not location_valid or not has_photo:
        missing = []

        if not text:
            missing.append("description")
        if not location_valid:
            missing.append("valid location")
        if not has_photo:
            missing.append("photo evidence")

        return VerificationDecision(
            verification_status="unverified",
            verification_method="rules",
            verification_reason=(
                "Required evidence missing: " + ", ".join(missing)
            ),
            emergency_priority="normal",
            should_escalate=False,
        )

    if duplicate_likely or image_matches_category is False:
        reason = (
            "Possible duplicate report; review required."
            if duplicate_likely
            else "Image may not match the reported category; review required."
        )

        return VerificationDecision(
            verification_status="needs_review",
            verification_method="rules_and_evidence",
            verification_reason=reason,
            emergency_priority=(
                "high" if category in HIGH_RISK_TYPES else "normal"
            ),
            should_escalate=False,
        )

    # A positive image match alone is not enough to prove the
    # event is real, current, and at the claimed location.
    corroborated = (
        trusted_source_confirms
        and image_matches_category is True
    )

    if category in LOW_RISK_TYPES and corroborated:
        return VerificationDecision(
            verification_status="verified",
            verification_method="rules_and_evidence",
            verification_reason=(
                "Low-risk report has matching image evidence and "
                "trusted-source corroboration."
            ),
            emergency_priority="normal",
            should_escalate=False,
        )

    weather_note = ""
    if weather_context:
        rain_val = (
            weather_context.get("rain_24hr")
            or weather_context.get("rain_1hr")
            or weather_context.get("rain_15min")
            or weather_context.get("rain")
            or 0.0
        )
        is_flood_related = any(kw in category for kw in ["flood", "waterlogging"])
        if is_flood_related:
            if float(rain_val) > 5.0:
                weather_note = f" Corroborated by local weather observation ({rain_val} mm recorded rainfall)."
            else:
                weather_note = " Local weather observation currently shows dry conditions, but waterlogging can persist after past rainfall or drainage blockage; human review retained."

    return VerificationDecision(
        verification_status="needs_review",
        verification_method="rules_and_weather" if weather_note else "rules",
        verification_reason=(
            "Evidence is not sufficient for automatic verification; "
            "human review is required." + weather_note
        ),
        emergency_priority=(
            "high" if category in HIGH_RISK_TYPES else "normal"
        ),
        should_escalate=False,
    )
