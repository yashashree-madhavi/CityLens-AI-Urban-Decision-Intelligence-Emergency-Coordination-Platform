from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from pathlib import Path
from uuid import uuid4
import os
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from fastapi.responses import FileResponse
import mimetypes
from pydantic import BaseModel
from app.database.database import get_db
from app.models.incident_report import IncidentReport
from app.models.alert import Alert
from app.schemas.incident_report import (
    IncidentReportCreate,
    IncidentReportResponse,
    IncidentVerificationReview
)
from app.models.user import User
from app.security.auth import get_current_user
from app.security.auth import require_role
from app.ai.fake_report_detection import detect_suspicious_report
from app.services.incident_verification_service import assess_report
from app.models.emergency import Emergency
from app.websocket.manager import manager
from app.services.emergency_services import (
    find_nearby_emergency_services,
)

router = APIRouter(
    prefix="/incidents",
    tags=["Incidents"]
)

UPLOAD_DIR = Path("uploads/incident_evidence").resolve()
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

@router.post("", response_model=IncidentReportResponse, status_code=201)
async def create_incident(
    incident: IncidentReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_incidents = (
        db.query(IncidentReport)
        .filter(IncidentReport.status != "rejected")
        .all()
    )

    new_incident = IncidentReport(
        user_id=current_user.id,
        incident_type=incident.incident_type,
        description=incident.description,
        latitude=incident.latitude,
        longitude=incident.longitude,
        status="reported",
        verification_status="unverified",
        verification_method="rules",
        verification_reason="Awaiting evidence upload and verification.",
        emergency_priority="normal"
    )

    # Preserve the existing suspicious-report detector.
    ai_analysis = detect_suspicious_report(
        existing_incidents,
        new_incident
    )

    new_incident.ai_classification = ai_analysis["classification"]
    new_incident.ai_suspicion_score = ai_analysis["suspicion_score"]
    new_incident.ai_reason = ai_analysis["reason"]

    # Assess the report. Photo upload and image analysis are not connected yet.
    decision = assess_report(
        incident_type=incident.incident_type,
        description=incident.description,
        has_photo=False,
        location_valid=(
            -90 <= incident.latitude <= 90
            and -180 <= incident.longitude <= 180
        ),
        urgent_danger_reported=False
    )

    new_incident.verification_status = decision.verification_status
    new_incident.verification_method = decision.verification_method
    new_incident.verification_reason = decision.verification_reason
    new_incident.emergency_priority = decision.emergency_priority

    emergency = None

    db.add(new_incident)

    try:
        # Obtain the incident ID before linking the emergency.
        db.flush()

        if decision.should_escalate:
            new_incident.escalated_at = datetime.now(timezone.utc)

            emergency = Emergency(
                user_id=new_incident.user_id,
                incident_report_id=new_incident.id,
                emergency_type=new_incident.incident_type,
                description=new_incident.description,
                latitude=new_incident.latitude,
                longitude=new_incident.longitude,
                status="active"
            )

            db.add(emergency)

        # Save the incident and linked emergency together.
        db.commit()
        db.refresh(new_incident)

        if emergency is not None:
            db.refresh(emergency)

    except Exception:
        db.rollback()
        raise

    
    # Broadcast only after the database commit succeeds.
    if emergency is not None:
        import logging

        logger = logging.getLogger(__name__)

        # Find nearby services for this emergency.
        try:
            lookup = await find_nearby_emergency_services(
                latitude=emergency.latitude,
                longitude=emergency.longitude,
                radius_meters=5000,
            )

            nearby_services = lookup["services"]
            source = lookup["source"]
            demo_only = lookup["demo_only"]

        except Exception:
            logger.exception(
                "Nearby emergency-service lookup failed for emergency %s",
                emergency.id,
            )
            nearby_services = []
            source = "unavailable"
            demo_only = False

        # These are simulation records, NOT real dispatches.
        simulated_notifications = [
            {
                "service_name": service["name"],
                "service_type": service["service_type"],
                "distance_meters": service["distance_meters"],
                "notification_status": "SIMULATED_ONLY",
                "message": (
                    "Demo notification generated. "
                    "No real emergency service was contacted."
                ),
            }
            for service in nearby_services
        ]

        emergency_event = {
            "id": emergency.id,
            "user_id": emergency.user_id,
            "emergency_type": emergency.emergency_type,
            "description": emergency.description,
            "latitude": emergency.latitude,
            "longitude": emergency.longitude,
            "status": emergency.status,
            "incident_report_id": new_incident.id,
            "emergency_priority": new_incident.emergency_priority,
            "escalated_at": (
                new_incident.escalated_at.isoformat()
                if new_incident.escalated_at
                else None
            ),
            "nearby_services": nearby_services,
            "simulated_notifications": simulated_notifications,
            "service_lookup_source": source,
            "demo_only": demo_only,
            "search_radius_meters": 5000,
        }

        try:
            await manager.broadcast({
                "type": "new_emergency",
                "data": emergency_event,
            })
        except Exception:
            logger.exception(
                "Emergency %s was saved, but dashboard broadcast failed.",
                emergency.id,
            )

    return new_incident


@router.post("/{incident_id}/evidence", response_model=IncidentReportResponse)
async def upload_incident_evidence(
    incident_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(IncidentReport)
        .filter(IncidentReport.id == incident_id)
        .first()
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    # Citizens can upload only to their own reports; admins can assist.
    is_admin = getattr(current_user, "role", None) == "admin"
    if incident.user_id != current_user.id and not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You can upload evidence only to your own incident",
        )

    # Do not replace evidence after the report has been rejected.
    if incident.status == "rejected":
        raise HTTPException(
            status_code=409,
            detail="Evidence cannot be uploaded to a rejected incident",
        )

    extension = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(
            status_code=415,
            detail="Upload a JPEG, PNG, or WebP image",
        )

    contents = await file.read(MAX_IMAGE_SIZE + 1)
    await file.close()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty",
        )

    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image must be 5 MB or smaller",
        )

    # Verify the file signature instead of trusting its filename or MIME type.
    valid_signature = (
        (extension == ".jpg" and contents.startswith(b"\xff\xd8\xff"))
        or (
            extension == ".png"
            and contents.startswith(b"\x89PNG\r\n\x1a\n")
        )
        or (
            extension == ".webp"
            and len(contents) >= 12
            and contents[:4] == b"RIFF"
            and contents[8:12] == b"WEBP"
        )
    )

    if not valid_signature:
        raise HTTPException(
            status_code=415,
            detail="File contents do not match a supported image format",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"incident_{incident.id}_{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    try:
        # Exclusive creation avoids accidentally overwriting another file.
        with destination.open("xb") as image_file:
            image_file.write(contents)

        incident.evidence_image_path = str(destination)
        incident.verification_status = "needs_review"
        incident.verification_method = "evidence_uploaded"
        incident.verification_reason = (
            "Image evidence uploaded. Human review is required; "
            "upload alone does not verify the incident."
        )

        db.commit()
        db.refresh(incident)

    except Exception:
        db.rollback()

        # Remove the new file if the database update fails.
        if destination.exists():
            destination.unlink()

        raise

    return incident


@router.get("/{incident_id}/evidence")
def view_incident_evidence(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    incident = (
        db.query(IncidentReport)
        .filter(IncidentReport.id == incident_id)
        .first()
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    # Permit viewing only for an admin or the citizen who reported the incident
    is_admin = getattr(current_user, "role", None) == "admin"
    is_owner = incident.user_id == current_user.id
    if not is_admin and not is_owner:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view evidence for this report",
        )

    if not incident.evidence_image_path:
        raise HTTPException(
            status_code=404,
            detail="No evidence image is attached to this incident",
        )

    # Resolve the stored path and ensure it remains inside the evidence folder.
    evidence_root = UPLOAD_DIR.resolve()
    image_path = Path(incident.evidence_image_path).resolve()

    try:
        image_path.relative_to(evidence_root)
    except ValueError:
        raise HTTPException(
            status_code=403,
            detail="Evidence path is outside the permitted directory",
        )

    if not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Evidence image file was not found",
        )

    media_type, _ = mimetypes.guess_type(image_path.name)

    if media_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=415,
            detail="Unsupported evidence image type",
        )

    return FileResponse(
        path=str(image_path),
        media_type=media_type,
        filename=image_path.name,
        content_disposition_type="inline",
    )


@router.get(
    "/my",
    response_model=list[IncidentReportResponse]
)
def get_my_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Citizen app: only the logged-in user's own reports."""
    return (
        db.query(IncidentReport)
        .filter(IncidentReport.user_id == current_user.id)
        .order_by(IncidentReport.created_at.desc())
        .all()
    )


@router.get(
    "",
    response_model=list[IncidentReportResponse]
)
def get_incidents(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(IncidentReport).order_by(
        IncidentReport.created_at.desc()
    ).all()

VALID_OPERATIONAL_TRANSITIONS = {
    "reported": {"investigating", "rejected"},
    "verified": {"investigating", "resolved", "rejected"},
    "investigating": {"resolved", "rejected"},
}

TERMINAL_OPERATIONAL_STATUSES = {"resolved", "rejected"}
TERMINAL_VERIFICATION_STATUSES = {"verified", "rejected"}


@router.patch("/{incident_id}/status")
def update_incident_status(
    incident_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    status = status.strip().lower()
    allowed_statuses = {
        "reported",
        "verified",
        "investigating",
        "resolved",
        "rejected"
    }

    if status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid incident status"
        )

    incident = (
        db.query(IncidentReport)
        .filter(IncidentReport.id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    current_status = (incident.status or "reported").lower()

    # Terminal state checks
    if current_status in TERMINAL_OPERATIONAL_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"A {current_status} complaint is in a terminal state and cannot be modified through ordinary status updates."
        )

    if status == current_status:
        return incident

    valid_targets = VALID_OPERATIONAL_TRANSITIONS.get(current_status, set())
    if status not in valid_targets:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from '{current_status}' to '{status}'. Permitted transitions: {sorted(valid_targets)}"
        )

    previous_status = incident.status
    incident.status = status

    if status == "resolved" and previous_status != "resolved":
        new_alert = Alert(
            user_id=incident.user_id,
            alert_type="incident_resolved",
            title="Incident Resolved",
            message=(
                f"Your reported {incident.incident_type} incident "
                "has been marked resolved by the CityLens administration."
            ),
            severity="info",
            is_read=0
        )
        db.add(new_alert)

    db.commit()
    db.refresh(incident)

    return incident


@router.patch("/{incident_id}/verification")
def review_incident_verification(
    incident_id: int,
    review: IncidentVerificationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    allowed_decisions = {"verified", "rejected", "needs_review"}

    decision = review.decision.strip().lower()
    reason = review.reason.strip()

    if decision not in allowed_decisions:
        raise HTTPException(
            status_code=400,
            detail="Decision must be verified, rejected, or needs_review",
        )

    if not reason:
        raise HTTPException(
            status_code=400,
            detail="A review reason is required",
        )

    incident = (
        db.query(IncidentReport)
        .filter(IncidentReport.id == incident_id)
        .first()
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    current_verification = (incident.verification_status or "unverified").lower()

    # Rule: Once verified, the verification decision cannot be changed
    if current_verification == "verified":
        raise HTTPException(
            status_code=409,
            detail="A verified complaint has reached a terminal verification state and cannot be changed to another decision",
        )

    # Rule: Once rejected, the verification decision cannot be changed via standard review
    if current_verification == "rejected":
        raise HTTPException(
            status_code=409,
            detail="A rejected complaint has reached a terminal verification decision and cannot be modified through ordinary review",
        )

    # A rejected operational report cannot be verified
    if incident.status == "rejected" and decision == "verified":
        raise HTTPException(
            status_code=409,
            detail="A rejected incident cannot be verified",
        )

    incident.verification_status = decision
    incident.verification_method = "admin_review"
    incident.verification_reason = reason

    if decision == "verified":
        incident.verified_at = datetime.now(timezone.utc)
        incident.verified_by = current_user.id

        new_alert = Alert(
            user_id=incident.user_id,
            alert_type="incident_verified",
            title="Incident Verified",
            message=(
                f"Your reported {incident.incident_type} incident "
                "has been verified by the CityLens administration."
            ),
            severity="warning",
            is_read=0
        )
        db.add(new_alert)
    else:
        incident.verified_at = None
        incident.verified_by = None

    try:
        db.commit()
        db.refresh(incident)
    except Exception:
        db.rollback()
        raise

    return incident


class ReopenRequest(BaseModel):
    reason: str


@router.post("/{incident_id}/reopen")
def reopen_incident(
    incident_id: int,
    request: ReopenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Separate, authorized, auditable administrative process to reopen
    a terminal record (resolved or rejected).
    """
    reopen_reason = request.reason.strip()
    if not reopen_reason:
        raise HTTPException(
            status_code=400,
            detail="An auditable reason is required to reopen a terminal incident"
        )

    incident = (
        db.query(IncidentReport)
        .filter(IncidentReport.id == incident_id)
        .first()
    )

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found"
        )

    if incident.status not in TERMINAL_OPERATIONAL_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Incident #{incident_id} is currently '{incident.status}' and not in a terminal state"
        )

    audit_note = (
        f"[REOPENED by Admin #{current_user.id} at {datetime.now(timezone.utc).isoformat()}]: "
        f"{reopen_reason}"
    )

    incident.status = "investigating"
    incident.verification_reason = (
        f"{incident.verification_reason}\n{audit_note}"
        if incident.verification_reason
        else audit_note
    )

    new_alert = Alert(
        user_id=incident.user_id,
        alert_type="incident_reopened",
        title="Incident Reopened for Investigation",
        message=f"Your reported {incident.incident_type} incident has been reopened for further investigation: {reopen_reason}",
        severity="info",
        is_read=0
    )
    db.add(new_alert)

    db.commit()
    db.refresh(incident)

    return incident
