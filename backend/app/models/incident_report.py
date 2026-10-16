from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.database.database import Base


class IncidentReport(Base):
    __tablename__ = "incident_reports"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    incident_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    status = Column(String(30), nullable=False, default="reported")

    ai_classification = Column(
        String(30),
        nullable=True
    )

    ai_suspicion_score = Column(
        Float,
        nullable=True
    )

    ai_reason = Column(
        Text,
        nullable=True
    )

    
    # Evidence reference (actual photo upload comes later)
    evidence_image_path = Column(String(500), nullable=True)

    # Verification lifecycle, separate from operational status
    verification_status = Column(
        String(30),
        nullable=False,
        default="unverified",
        server_default="unverified"
    )

    verification_method = Column(String(30), nullable=True)
    verification_confidence = Column(Float, nullable=True)
    verification_reason = Column(Text, nullable=True)

    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    # Urgency is separate from verification status
    emergency_priority = Column(
        String(20),
        nullable=False,
        default="normal",
        server_default="normal"
    )

    escalated_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )