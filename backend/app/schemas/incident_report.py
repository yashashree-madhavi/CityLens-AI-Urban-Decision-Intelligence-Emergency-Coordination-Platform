from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IncidentReportCreate(BaseModel):
    incident_type: str
    description: Optional[str] = None
    latitude: float
    longitude: float


class IncidentReportResponse(BaseModel):
    id: int
    user_id: int
    incident_type: str
    description: Optional[str]
    latitude: float
    longitude: float
    status: str

    ai_classification: Optional[str] = None
    ai_suspicion_score: Optional[float] = None
    ai_reason: Optional[str] = None
    
    # Verification information
    evidence_image_path: Optional[str] = None
    verification_status: str = "unverified"
    verification_method: Optional[str] = None
    verification_confidence: Optional[float] = None
    verification_reason: Optional[str] = None
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None

    # Emergency escalation information
    emergency_priority: str = "normal"
    escalated_at: Optional[datetime] = None

    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IncidentVerificationReview(BaseModel):
    decision: str
    reason: str
