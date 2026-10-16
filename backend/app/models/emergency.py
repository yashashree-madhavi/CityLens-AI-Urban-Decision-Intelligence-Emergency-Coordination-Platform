from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.sql import func

from app.database.database import Base


class Emergency(Base):
    __tablename__ = "emergencies"

    __table_args__ = (
        UniqueConstraint(
            "incident_report_id",
            name="uq_emergencies_incident_report_id"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    incident_report_id = Column(
        Integer,
        ForeignKey("incident_reports.id"),
        nullable=True
    )

    emergency_type = Column(
        String(50),
        nullable=False
    )

    description = Column(
        String(500),
        nullable=True
    )

    latitude = Column(
        Float,
        nullable=False
    )

    longitude = Column(
        Float,
        nullable=False
    )

    status = Column(
        String(30),
        nullable=False,
        default="active"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )