from sqlalchemy import Column, Integer, Float, String, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from app.database.database import Base


class BMCWeatherData(Base):
    __tablename__ = "bmc_weather_data"

    __table_args__ = (
        UniqueConstraint(
            "bmc_location_id",
            "timestamp",
            name="uq_bmc_weather_station_timestamp"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    bmc_location_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    station_name = Column(
        String(150),
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

    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )

    temperature = Column(
        Float,
        nullable=True
    )

    humidity = Column(
        Float,
        nullable=True
    )

    wind_speed = Column(
        Float,
        nullable=True
    )

    wind_direction = Column(
        String(20),
        nullable=True
    )

    pressure = Column(
        Float,
        nullable=True
    )

    rain_15min = Column(
        Float,
        nullable=True
    )

    rain_rate = Column(
        Float,
        nullable=True
    )

    rain_1hr = Column(
        Float,
        nullable=True
    )

    rain_3hr = Column(
        Float,
        nullable=True
    )

    rain_6hr = Column(
        Float,
        nullable=True
    )

    rain_12hr = Column(
        Float,
        nullable=True
    )

    rain_24hr = Column(
        Float,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
    