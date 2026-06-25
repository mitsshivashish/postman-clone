import config
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

import os
from config import BASE_DIR

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("[database] ERROR: DATABASE_URL environment variable is missing!")
    raise RuntimeError("DATABASE_URL environment variable is required to start the application.")

# SQLAlchemy 1.4+ requires "postgresql://" dialect instead of deprecated "postgres://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Safely print the host part of the database URL (hiding username/password)
safe_url = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
print(f"[database] Initializing connection to database: {safe_url}")

try:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300
    )
except Exception as e:
    print(f"[database] ERROR: Failed to create SQLAlchemy engine: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Collection(Base):
    __tablename__ = "collections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    requests = relationship("SavedRequest", back_populates="collection", cascade="all, delete-orphan")


class SavedRequest(Base):
    __tablename__ = "saved_requests"
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, default="")
    method = Column(String(10), nullable=False, default="GET")
    url = Column(Text, nullable=False, default="")
    headers = Column(Text, default="[]")       # JSON string
    params = Column(Text, default="[]")        # JSON string
    body_type = Column(String(30), default="none")  # none | raw | form-data | x-www-form-urlencoded
    body_content = Column(Text, default="")
    body_raw_type = Column(String(20), default="JSON")  # JSON | Text
    auth_type = Column(String(30), default="none")      # none | bearer | basic
    auth_data = Column(Text, default="{}")     # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    collection = relationship("Collection", back_populates="requests")


class Environment(Base):
    __tablename__ = "environments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    variables = relationship("EnvironmentVariable", back_populates="environment", cascade="all, delete-orphan")


class EnvironmentVariable(Base):
    __tablename__ = "environment_variables"
    id = Column(Integer, primary_key=True, index=True)
    environment_id = Column(Integer, ForeignKey("environments.id"), nullable=False)
    key = Column(String(255), nullable=False)
    value = Column(Text, default="")
    current_value = Column(Text, default="")
    is_enabled = Column(Boolean, default=True)
    environment = relationship("Environment", back_populates="variables")


class History(Base):
    __tablename__ = "history"
    id = Column(Integer, primary_key=True, index=True)
    method = Column(String(10), nullable=False)
    url = Column(Text, nullable=False)
    headers = Column(Text, default="[]")
    params = Column(Text, default="[]")
    body_type = Column(String(30), default="none")
    body_content = Column(Text, default="")
    body_raw_type = Column(String(20), default="JSON")
    auth_type = Column(String(30), default="none")
    auth_data = Column(Text, default="{}")
    response_status = Column(Integer, nullable=True)
    response_time = Column(Float, nullable=True)
    response_size = Column(Integer, nullable=True)
    response_headers = Column(Text, default="{}")
    response_body = Column(Text, default="")
    response_error = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
