"""Connection Events routes (read-only)"""

from flask import Blueprint, request, jsonify
from sqlalchemy import desc

from ..database import db_session
from ..models import Greenhouse, ConnectionEvent
from ..auth import require_auth, get_current_user
from ..utils import serialize_list, error_response

connections_bp = Blueprint('connections', __name__)


@connections_bp.get('/<greenhouse_id>/connections')
@require_auth
def get_connections(greenhouse_id):
    """
    Get connection events for a greenhouse.
    
    Requires: Authorization header with Bearer token
    Only owner can access.
    
    Query parameters:
        - limit: int (optional, default: 50, max: 500)
    
    Returns:
        200: List of connection events
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
        
        # Get limit parameter
        limit = request.args.get('limit', 50, type=int)
        if limit < 1 or limit > 500:
            return error_response('Limit must be between 1 and 500', status_code=400)
        
        # Get connection events
        events = db_session.query(ConnectionEvent).filter(
            ConnectionEvent.greenhouse_id == greenhouse_id
        ).order_by(desc(ConnectionEvent.start_ts)).limit(limit).all()
        
        return jsonify({
            'count': len(events),
            'data': serialize_list(events)
        }), 200
        
    except Exception as e:
        return error_response(str(e), status_code=500)
