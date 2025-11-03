"""Setpoint routes"""

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from ..database import db_session
from ..models import Greenhouse, Setpoint
from ..auth import require_auth, get_current_user
from ..utils import serialize_model, error_response
from ..validators import validate_setpoint
from ..mqtt_client import get_mqtt_client

setpoints_bp = Blueprint('setpoints', __name__)


@setpoints_bp.get('/<greenhouse_id>/setpoint')
@require_auth
def get_setpoint(greenhouse_id):
    """
    Get setpoint for a greenhouse.
    
    Requires: Authorization header with Bearer token
    Only owner can access.
    
    Returns:
        200: Setpoint data
        401: Unauthorized
        403: Forbidden (not owner)
        404: Greenhouse or setpoint not found
    """
    try:
        user = get_current_user()
        
        # Check greenhouse ownership
        greenhouse = db_session.query(Greenhouse).filter(
            Greenhouse.id == greenhouse_id
        ).first()
        
        if not greenhouse:
            return error_response('Greenhouse not found', status_code=404)
        
        if greenhouse.owner_id != user.id:
            return error_response('Access denied - you do not own this greenhouse', status_code=403)
        
        # Get setpoint
        setpoint = db_session.query(Setpoint).filter(
            Setpoint.greenhouse_id == greenhouse_id
        ).first()
        
        if not setpoint:
            return error_response('Setpoint not found for this greenhouse', status_code=404)
        
        return jsonify(serialize_model(setpoint)), 200
        
    except Exception as e:
        return error_response(str(e), status_code=500)


@setpoints_bp.put('/<greenhouse_id>/setpoint')
@require_auth
def update_setpoint(greenhouse_id):
    """
    Update setpoint for a greenhouse.
    Creates new setpoint if doesn't exist.
    Publishes to MQTT for ESP32.
    
    Requires: Authorization header with Bearer token
    Only owner can update.
    
    Request body (all required):
        - target_temp_min: float (0-40)
        - target_temp_max: float (0-50, must be > min)
        - target_hum_air_max: float (0-100)
        - irrigation_interval_minutes: int (1-1440)
        - irrigation_duration_seconds: int (1-600)
        - target_light_intensity: float (0-100000)
    
    Returns:
        200: Setpoint updated
        400: Validation error
        401: Unauthorized
        403: Forbidden (not owner)
        404: Greenhouse not found
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Check greenhouse ownership
        greenhouse = db_session.query(Greenhouse).filter(
            Greenhouse.id == greenhouse_id
        ).first()
        
        if not greenhouse:
            return error_response('Greenhouse not found', status_code=404)
        
        if greenhouse.owner_id != user.id:
            return error_response('Access denied - you do not own this greenhouse', status_code=403)
        
        # Validate setpoint data
        is_valid, errors = validate_setpoint(data)
        if not is_valid:
            return error_response('Validation failed', details=errors, status_code=400)
        
        # Check if setpoint exists
        setpoint = db_session.query(Setpoint).filter(
            Setpoint.greenhouse_id == greenhouse_id
        ).first()
        
        if setpoint:
            # Update existing
            setpoint.target_temp_min = data['target_temp_min']
            setpoint.target_temp_max = data['target_temp_max']
            setpoint.target_hum_air_max = data['target_hum_air_max']
            setpoint.irrigation_interval_minutes = data['irrigation_interval_minutes']
            setpoint.irrigation_duration_seconds = data['irrigation_duration_seconds']
            setpoint.target_light_intensity = data['target_light_intensity']
            setpoint.changed_at = datetime.utcnow()
        else:
            # Create new
            setpoint = Setpoint(
                greenhouse_id=greenhouse_id,
                target_temp_min=data['target_temp_min'],
                target_temp_max=data['target_temp_max'],
                target_hum_air_max=data['target_hum_air_max'],
                irrigation_interval_minutes=data['irrigation_interval_minutes'],
                irrigation_duration_seconds=data['irrigation_duration_seconds'],
                target_light_intensity=data['target_light_intensity']
            )
            db_session.add(setpoint)
        
        db_session.commit()
        
        # Publish to MQTT
        mqtt_client = get_mqtt_client()
        setpoint_data = {
            'target_temp_min': setpoint.target_temp_min,
            'target_temp_max': setpoint.target_temp_max,
            'target_hum_air_max': setpoint.target_hum_air_max,
            'irrigation_interval_minutes': setpoint.irrigation_interval_minutes,
            'irrigation_duration_seconds': setpoint.irrigation_duration_seconds,
            'target_light_intensity': setpoint.target_light_intensity,
            'changed_at': setpoint.changed_at
        }
        mqtt_client.publish_setpoint(str(greenhouse_id), setpoint_data)
        
        return jsonify(serialize_model(setpoint)), 200
        
    except SQLAlchemyError as e:
        db_session.rollback()
        return error_response(str(e), status_code=500)
