"""Telemetry routes (read-only)"""

from flask import Blueprint, request, jsonify
from sqlalchemy import desc, and_
from datetime import datetime, timedelta

from ..database import db_session
from ..models import Greenhouse, Telemetry
from ..auth import require_auth, get_current_user
from ..utils import serialize_list, error_response
from ..validators import validate_telemetry_query

telemetry_bp = Blueprint('telemetry', __name__)


@telemetry_bp.get('/<greenhouse_id>/telemetry')
@require_auth
def get_telemetry(greenhouse_id):
    """
    Get telemetry data for a greenhouse.
    
    Requires: Authorization header with Bearer token
    Only owner can access.
    
    Query parameters:
        - days: int (optional, 1-365, default: 7) - get last N days
        - start_date: ISO date string (optional) - filter from date
        - end_date: ISO date string (optional) - filter to date
        - limit: int (optional, 1-10000, default: 1000) - max records
    
    Returns:
        200: List of telemetry records
        400: Validation error
        401: Unauthorized
        403: Forbidden (not owner)
        404: Greenhouse not found
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
        
        # Get query parameters
        days = request.args.get('days', type=int)
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        limit = request.args.get('limit', 1000, type=int)
        
        # Validate parameters
        is_valid, errors = validate_telemetry_query(days, start_date_str, end_date_str, limit)
        if not is_valid:
            return error_response('Validation failed', details=errors, status_code=400)
        
        # Build query
        query = db_session.query(Telemetry).filter(
            Telemetry.greenhouse_id == greenhouse_id
        )
        
        # Apply date filters
        if days is not None:
            # Last N days
            time_threshold = datetime.utcnow() - timedelta(days=days)
            query = query.filter(Telemetry.time >= time_threshold)
        elif start_date_str or end_date_str:
            # Date range
            if start_date_str:
                try:
                    start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
                    query = query.filter(Telemetry.time >= start_date)
                except ValueError:
                    return error_response('Invalid start_date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)', status_code=400)
            
            if end_date_str:
                try:
                    end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                    query = query.filter(Telemetry.time <= end_date)
                except ValueError:
                    return error_response('Invalid end_date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)', status_code=400)
        else:
            # Default: last 7 days
            time_threshold = datetime.utcnow() - timedelta(days=7)
            query = query.filter(Telemetry.time >= time_threshold)
        
        # Order and limit
        query = query.order_by(desc(Telemetry.time)).limit(limit)
        
        telemetry_data = query.all()
        
        return jsonify({
            'count': len(telemetry_data),
            'data': serialize_list(telemetry_data)
        }), 200
        
    except Exception as e:
        return error_response(str(e), status_code=500)


@telemetry_bp.get('/<greenhouse_id>/telemetry/latest')
@require_auth
def get_latest_telemetry(greenhouse_id):
    """
    Get latest telemetry reading for a greenhouse.
    
    Requires: Authorization header with Bearer token
    Only owner can access.
    
    Returns:
        200: Latest telemetry record
        401: Unauthorized
        403: Forbidden (not owner)
        404: Greenhouse or telemetry not found
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
        
        # Get latest telemetry
        telemetry = db_session.query(Telemetry).filter(
            Telemetry.greenhouse_id == greenhouse_id
        ).order_by(desc(Telemetry.time)).first()
        
        if not telemetry:
            return error_response('No telemetry data found for this greenhouse', status_code=404)
        
        from ..utils import serialize_model
        return jsonify(serialize_model(telemetry)), 200
        
    except Exception as e:
        return error_response(str(e), status_code=500)
