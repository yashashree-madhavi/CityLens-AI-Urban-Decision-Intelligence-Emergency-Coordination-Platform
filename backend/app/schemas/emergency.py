from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EmergencyCreate(BaseModel):
    emergency_type: str
    description: Optional[str] = None
    latitude: float
    longitude: float


class EmergencyResponse(BaseModel):
    id: int
    user_id: int
    emergency_type: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResourceRecommendationResponse(BaseModel):
    priority: str
    recommended_resources: list[str]
    reasons: list[str]


class EmergencyWithRecommendationResponse(BaseModel):
    emergency: EmergencyResponse
    resource_recommendation: ResourceRecommendationResponse