from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging

from .database import db_session, engine, Config, init_db
from .models import Base
from .mqtt_client import init_mqtt

# Import routes
from .routes.auth import auth_bp
from .routes.greenhouses import greenhouses_bp
from .routes.setpoints import setpoints_bp
from .routes.telemetry import telemetry_bp
from .routes.plants import plants_bp
from .routes.connections import connections_bp
from .routes.timezones import timezones_bp


def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, Config.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    
    # Enable CORS
    if Config.CORS_ORIGINS == '*':
        CORS(app)
        logger.info("CORS enabled for all origins")
    else:
        origins = [origin.strip() for origin in Config.CORS_ORIGINS.split(',')]
        CORS(app, origins=origins)
        logger.info(f"CORS enabled for origins: {origins}")
    
    # Uncomment when frontend is ready:
    # CORS(app, origins=['http://localhost:3000'])
    
    # Initialize database tables (if not exists)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized")
    
    # Initialize MQTT client
    init_mqtt()
    logger.info("MQTT client initialized")
    
    # Teardown app context - close db session
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()
    
    # ==================== Health Check ====================
    @app.get("/health")
    def health():
        """Health check endpoint"""
        try:
            # Test database connection and get current database name
            from sqlalchemy import text
            result = db_session.execute(text("SELECT current_database()"))
            current_db = result.scalar()
            db_status = "ok"
        except Exception as e:
            current_db = "error"
            db_status = f"error: {str(e)}"
            logger.error(f"Database health check failed: {e}")
        
        return jsonify({
            "status": "ok",
            "environment": Config.ENVIRONMENT,
            "database": db_status,
            "current_db": current_db,
            "using_test_db": Config.USE_TEST_DB
        }), 200
    
    @app.get("/debug/test-json")
    def debug_test_json():
        """Debug endpoint to test JSON serialization"""
        from uuid import uuid4
        test_id = uuid4()
        return jsonify({
            "message": "Test successful",
            "uuid_str": str(test_id),
            "simple_string": "hello",
            "number": 123
        }), 200
    
    # ==================== Register Blueprints ====================
    # Authentication
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Greenhouses
    app.register_blueprint(greenhouses_bp, url_prefix='/api/greenhouses')
    
    # Setpoints (nested under greenhouses)
    app.register_blueprint(setpoints_bp, url_prefix='/api/greenhouses')
    
    # Telemetry (nested under greenhouses)
    app.register_blueprint(telemetry_bp, url_prefix='/api/greenhouses')
    
    # Connection events (nested under greenhouses)
    app.register_blueprint(connections_bp, url_prefix='/api/greenhouses')
    
    # Plants
    app.register_blueprint(plants_bp, url_prefix='/api/plants')
    
    # Timezones
    app.register_blueprint(timezones_bp, url_prefix='/api/timezones')
    
    logger.info("All routes registered successfully")
    logger.info(f"API running in {Config.ENVIRONMENT} mode")
    
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
