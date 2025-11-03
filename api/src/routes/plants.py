"""Plants routes (read-only)"""

from flask import Blueprint, jsonify

from ..database import db_session
from ..models import Plant
from ..auth import require_auth
from ..utils import serialize_model, serialize_list, error_response

plants_bp = Blueprint('plants', __name__)


@plants_bp.get('')
@require_auth
def list_plants():
    """
    Get all plant templates.
    
    Requires: Authorization header with Bearer token
    
    Returns:
        200: List of all plants
        401: Unauthorized
    """
    try:
        plants = db_session.query(Plant).all()
        return jsonify(serialize_list(plants)), 200
    except Exception as e:
        return error_response(str(e), status_code=500)


@plants_bp.get('/<plant_id>')
@require_auth
def get_plant(plant_id):
    """
    Get plant template by ID.
    
    Requires: Authorization header with Bearer token
    
    Returns:
        200: Plant data
        401: Unauthorized
        404: Plant not found
    """
    try:
        plant = db_session.query(Plant).filter(Plant.plant_it == plant_id).first()
        
        if not plant:
            return error_response('Plant not found', status_code=404)
        
        return jsonify(serialize_model(plant)), 200
    except Exception as e:
        return error_response(str(e), status_code=500)
