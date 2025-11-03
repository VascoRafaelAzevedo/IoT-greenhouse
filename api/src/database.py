import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Application configuration from environment variables"""
    
    # Determine which database to use
    USE_TEST_DB = os.getenv('USE_TEST_DB', 'false').lower() == 'true'
    db_name = os.getenv('DB_NAME_TEST') if USE_TEST_DB else os.getenv('DB_NAME')
    
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = db_name
    
    # Build database URI
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    JWT_SECRET = os.getenv("JWT_SECRET")
    JWT_EXPIRY_DAYS = int(os.getenv("JWT_EXPIRY_DAYS", 30))
    
    MQTT_BROKER = os.getenv("MQTT_HOST", "localhost")  # Using MQTT_HOST from .env
    MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
    
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    CORS_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "*")


# Create database engine
engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=Config.ENVIRONMENT == 'development'
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create scoped session for thread-safe access
db_session = scoped_session(SessionLocal)


def get_db():
    """
    Dependency function to get database session.
    Use in Flask context to get a session that will be automatically closed.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database - create all tables"""
    from .models import Base
    Base.metadata.create_all(bind=engine)


def close_db():
    """Close database session"""
    db_session.remove()
