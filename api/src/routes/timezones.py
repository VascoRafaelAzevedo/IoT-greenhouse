"""Timezones routes"""

from flask import Blueprint, jsonify

from ..database import db_session
from ..models import Timezone
from ..utils import serialize_list, error_response

timezones_bp = Blueprint('timezones', __name__)


@timezones_bp.get('')
def list_timezones():
    """
    Get all available timezones.
    
    Public endpoint - no authentication required.
    
    Returns:
        200: List of timezones
    """
    try:
        timezones = db_session.query(Timezone).order_by(Timezone.utc_offset, Timezone.tz_name).all()
        return jsonify(serialize_list(timezones)), 200
    except Exception as e:
        return error_response(str(e), status_code=500)
