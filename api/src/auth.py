import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, g
from .database import Config, db_session
from .models import AppUser
from .utils import error_response


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))


def generate_token(user_id: str) -> str:
    """
    Generate JWT token for user.
    Token expires in JWT_EXPIRY_DAYS (default 30 days).
    """
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=Config.JWT_EXPIRY_DAYS),
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')
    # Ensure token is string, not bytes
    if isinstance(token, bytes):
        token = token.decode('utf-8')
    return token


def decode_token(token: str):
    """
    Decode and validate JWT token.
    Returns payload if valid, None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    """
    Decorator to require authentication for endpoints.
    Extracts user from JWT token in Authorization header.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return error_response('Missing Authorization header', status_code=401)
        
        # Extract token
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return error_response('Invalid Authorization header format. Use: Bearer <token>', status_code=401)
        
        token = parts[1]
        
        # Decode token
        payload = decode_token(token)
        if not payload:
            return error_response('Invalid or expired token', status_code=401)
        
        # Get user from database
        user_id = payload.get('user_id')
        user = db_session.query(AppUser).filter(AppUser.id == user_id).first()
        if not user:
            return error_response('User not found', status_code=401)
        
        # Store user in request context
        g.current_user = user
        
        return f(*args, **kwargs)
    
    return decorated_function


def get_current_user():
    """Get current authenticated user from request context"""
    return g.get('current_user', None)
