"""Greenhouse routes"""

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import SQLAlchemyError

from ..database import db_session
from ..models import Greenhouse
from ..auth import require_auth, get_current_user
from ..utils import serialize_model, serialize_list, error_response
from ..validators import validate_greenhouse_create

greenhouses_bp = Blueprint('greenhouses', __name__)


@greenhouses_bp.get('')
@require_auth
def list_greenhouses():
    """
    Get all greenhouses for current user.
    
    Requires: Authorization header with Bearer token
    
    Returns:
        200: List of greenhouses
        401: Unauthorized
    """
    try:
        user = get_current_user()
        greenhouses = db_session.query(Greenhouse).filter(
            Greenhouse.owner_id == user.id
        ).all()
        
        return jsonify(serialize_list(greenhouses)), 200
    except Exception as e:
        return error_response(str(e), status_code=500)


@greenhouses_bp.get('/<greenhouse_id>')
@require_auth
def get_greenhouse(greenhouse_id):
    """
    Get greenhouse by ID.
    
    Requires: Authorization header with Bearer token
    Only returns if greenhouse belongs to current user.
    
    Returns:
        200: Greenhouse data
        401: Unauthorized
        403: Forbidden (not owner)
        404: Not found
    """
    try:
        user = get_current_user()
        
        greenhouse = db_session.query(Greenhouse).filter(
            Greenhouse.id == greenhouse_id
        ).first()
        
        if not greenhouse:
            return error_response('Greenhouse not found', status_code=404)
        
        # Check ownership
        if greenhouse.owner_id != user.id:
            return error_response('Access denied - you do not own this greenhouse', status_code=403)
        
        return jsonify(serialize_model(greenhouse)), 200
    except Exception as e:
        return error_response(str(e), status_code=500)


@greenhouses_bp.post('')
@require_auth
def create_greenhouse():
    """
    Create new greenhouse for current user.
    
    Requires: Authorization header with Bearer token
    
    Request body:
        - name: str (required)
    
    Returns:
        201: Greenhouse created
        400: Validation error
        401: Unauthorized
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Validate input
        is_valid, errors = validate_greenhouse_create(data)
        if not is_valid:
            return error_response('Validation failed', details=errors, status_code=400)
        
        # Create greenhouse
        greenhouse = Greenhouse(
            owner_id=user.id,
            name=data['name'].strip()
        )
        
        db_session.add(greenhouse)
        db_session.commit()
        
        return jsonify(serialize_model(greenhouse)), 201
        
    except SQLAlchemyError as e:
        db_session.rollback()
        return error_response(str(e), status_code=500)


@greenhouses_bp.put('/<greenhouse_id>')
@require_auth
def update_greenhouse(greenhouse_id):
    """
    Update greenhouse name.
    
    Requires: Authorization header with Bearer token
    Only owner can update.
    
    Request body:
        - name: str (required)
    
    Returns:
        200: Greenhouse updated
        400: Validation error
        401: Unauthorized
        403: Forbidden (not owner)
        404: Not found
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        greenhouse = db_session.query(Greenhouse).filter(
            Greenhouse.id == greenhouse_id
        ).first()
        
        if not greenhouse:
            return error_response('Greenhouse not found', status_code=404)
        
        # Check ownership
        if greenhouse.owner_id != user.id:
            return error_response('Access denied - you do not own this greenhouse', status_code=403)
        
        # Validate name
        if 'name' not in data or not data['name'] or data['name'].strip() == '':
            return error_response('Greenhouse name is required', status_code=400)
        
        # Update name
        greenhouse.name = data['name'].strip()
        db_session.commit()
        
        return jsonify(serialize_model(greenhouse)), 200
        
    except SQLAlchemyError as e:
        db_session.rollback()
        return error_response(str(e), status_code=500)


@greenhouses_bp.delete('/<greenhouse_id>')
@require_auth
def delete_greenhouse(greenhouse_id):
    """
    Delete greenhouse.
    
    Requires: Authorization header with Bearer token
    Only owner can delete.
    
    Returns:
        204: Greenhouse deleted
        401: Unauthorized
        403: Forbidden (not owner)
        404: Not found
    """
    try:
        user = get_current_user()
        
        greenhouse = db_session.query(Greenhouse).filter(
            Greenhouse.id == greenhouse_id
        ).first()
        
        if not greenhouse:
            return error_response('Greenhouse not found', status_code=404)
        
        # Check ownership
        if greenhouse.owner_id != user.id:
            return error_response('Access denied - you do not own this greenhouse', status_code=403)
        
        db_session.delete(greenhouse)
        db_session.commit()
        
        return '', 204
        
    except SQLAlchemyError as e:
        db_session.rollback()
        return error_response(str(e), status_code=500)
