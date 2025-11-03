from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class Timezone(Base):
    __tablename__ = 'timezone'
    __table_args__ = {'schema': 'public'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    tz_name = Column(Text, nullable=False)
    utc_offset = Column(Integer, nullable=False)

    # Relationships
    users = relationship("AppUser", back_populates="timezone")


class AppUser(Base):
    __tablename__ = 'app_user'
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_sub = Column(Text, unique=True, nullable=True)
    email = Column(Text, unique=True, nullable=True)
    display_name = Column(Text, nullable=True)
    timezone_id = Column(Integer, ForeignKey('public.timezone.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    phone_country_code = Column(Text, nullable=True)
    phone_number = Column(Text, nullable=True)
    password_hash = Column(Text, nullable=True)

    # Relationships
    timezone = relationship("Timezone", back_populates="users")
    greenhouses = relationship("Greenhouse", back_populates="owner", cascade="all, delete-orphan")


class Greenhouse(Base):
    __tablename__ = 'greenhouse'
    __table_args__ = {'schema': 'public'}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('public.app_user.id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False, default='')
    last_seen = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("AppUser", back_populates="greenhouses")
    setpoint = relationship("Setpoint", back_populates="greenhouse", uselist=False, cascade="all, delete-orphan")
    telemetry = relationship("Telemetry", back_populates="greenhouse", cascade="all, delete-orphan")
    connection_events = relationship("ConnectionEvent", back_populates="greenhouse", cascade="all, delete-orphan")


class Setpoint(Base):
    __tablename__ = 'setpoint'
    __table_args__ = {'schema': 'public'}

    greenhouse_id = Column(UUID(as_uuid=True), ForeignKey('public.greenhouse.id', ondelete='CASCADE'), primary_key=True)
    target_temp_min = Column(Float, nullable=True)
    target_temp_max = Column(Float, nullable=True)
    target_hum_air_max = Column(Float, nullable=True)  # Removed target_hum_air_min
    irrigation_interval_minutes = Column(Integer, nullable=True)
    irrigation_duration_seconds = Column(Integer, nullable=True)
    target_light_intensity = Column(Float, nullable=True)
    changed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    greenhouse = relationship("Greenhouse", back_populates="setpoint")


class Plant(Base):
    __tablename__ = 'plants'
    __table_args__ = {'schema': 'public'}

    plant_it = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plant_name = Column(Text, nullable=False)
    plant_descripion = Column(Text, nullable=False)
    target_temp_min = Column(Float, nullable=True)
    target_temp_max = Column(Float, nullable=True)
    target_hum_air_max = Column(Float, nullable=True)  # Removed target_hum_air_min
    irrigation_interval_minutes = Column(Integer, nullable=True)
    irrigation_duration_seconds = Column(Integer, nullable=True)
    target_light_intensity = Column(Float, nullable=True)


class ConnectionEvent(Base):
    __tablename__ = 'connection_event'
    __table_args__ = {'schema': 'public'}

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    greenhouse_id = Column(UUID(as_uuid=True), ForeignKey('public.greenhouse.id', ondelete='CASCADE'), nullable=False)
    start_ts = Column(DateTime(timezone=True), nullable=False)
    end_ts = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    greenhouse = relationship("Greenhouse", back_populates="connection_events")


class Telemetry(Base):
    __tablename__ = 'telemetry'
    __table_args__ = {'schema': 'public'}

    time = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    greenhouse_id = Column(UUID(as_uuid=True), ForeignKey('public.greenhouse.id', ondelete='CASCADE'), primary_key=True, nullable=False)
    sequence = Column(BigInteger, primary_key=True, nullable=False)
    temp_air = Column(Float, nullable=True)
    hum_air = Column(Float, nullable=True)
    lux = Column(Float, nullable=True)
    light_intensity = Column(Float, nullable=True)
    light_on = Column(Boolean, nullable=True)
    water_level_ok = Column(Boolean, nullable=True)
    pump_on = Column(Boolean, nullable=True)

    # Relationships
    greenhouse = relationship("Greenhouse", back_populates="telemetry")
