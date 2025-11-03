"""Authentication routes"""

from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from ..database import db_session
from ..models import AppUser, Timezone
from ..auth import hash_password, verify_password, generate_token, require_auth, get_current_user
from ..utils import serialize_model, error_response
from ..validators import validate_user_registration

auth_bp = Blueprint('auth', __name__)


@auth_bp.post('/register')
def register():
    """
    Register new user with email and password.
    
    Request body:
        - email: str (required)
        - password: str (required, min 8 chars)
        - display_name: str (required)
        - timezone_id: int (required)
    
    Returns:
        201: User created with auth token
        400: Validation error
        409: Email already exists
    """
    try:
        data = request.get_json()
        
        # Validate input
        is_valid, errors = validate_user_registration(data)
        if not is_valid:
            return error_response('Validation failed', details=errors, status_code=400)
        
        # Check if timezone exists
        timezone = db_session.query(Timezone).filter(Timezone.id == data['timezone_id']).first()
        if not timezone:
            return error_response('Invalid timezone_id', status_code=400)
        
        # Hash password
        password_hash = hash_password(data['password'])
        
        # Create user
        user = AppUser(
            email=data['email'],
            password_hash=password_hash,
            display_name=data['display_name'],
            timezone_id=data['timezone_id']
        )
        
        db_session.add(user)
        db_session.commit()
        
        # Generate token
        token = generate_token(user.id)
        
        # Return response without password_hash
        return jsonify({
            'message': 'User created successfully',
            'user_id': str(user.id),
            'email': user.email,
            'display_name': user.display_name,
            'token': token
        }), 201
        
    except IntegrityError as e:
        db_session.rollback()
        if 'email' in str(e.orig):
            return error_response('Email already registered', status_code=409)
        return error_response('Database integrity error', status_code=400)
    except Exception as e:
        db_session.rollback()
        return error_response(str(e), status_code=500)


@auth_bp.post('/login')
def login():
    """
    Login with email and password.
    
    Request body:
        - email: str
        - password: str
    
    Returns:
        200: Login successful with token
        401: Invalid credentials
    """
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return error_response('Email and password are required', status_code=400)
        
        # Find user
        user = db_session.query(AppUser).filter(AppUser.email == email).first()
        if not user or not user.password_hash:
            return error_response('Invalid email or password', status_code=401)
        
        # Verify password
        if not verify_password(password, user.password_hash):
            return error_response('Invalid email or password', status_code=401)
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        db_session.commit()
        
        # Generate token
        token = generate_token(user.id)
        
        # Return response without password_hash
        return jsonify({
            'message': 'Login successful',
            'user_id': str(user.id),
            'email': user.email,
            'display_name': user.display_name,
            'token': token
        }), 200
        
    except Exception as e:
        db_session.rollback()
        return error_response(str(e), status_code=500)


@auth_bp.get('/me')
@require_auth
def get_me():
    """
    Get current authenticated user info.
    
    Requires: Authorization header with Bearer token
    
    Returns:
        200: User data
        401: Unauthorized
    """
    try:
        user = get_current_user()
        return jsonify(serialize_model(user)), 200
    except Exception as e:
        return error_response(str(e), status_code=500)


@auth_bp.put('/me')
@require_auth
def update_me():
    """
    Update current user's profile.
    
    Requires: Authorization header with Bearer token
    
    Request body (all optional):
        - display_name: str
        - timezone_id: int
    
    Returns:
        200: Updated user data
        400: Validation error
        401: Unauthorized
    """
    try:
        user = get_current_user()
        data = request.get_json()
        
        # Update display name
        if 'display_name' in data:
            if not data['display_name'] or data['display_name'].strip() == '':
                return error_response('Display name cannot be empty', status_code=400)
            user.display_name = data['display_name']
        
        # Update timezone
        if 'timezone_id' in data:
            timezone = db_session.query(Timezone).filter(Timezone.id == data['timezone_id']).first()
            if not timezone:
                return error_response('Invalid timezone_id', status_code=400)
            user.timezone_id = data['timezone_id']
        
        db_session.commit()
        
        return jsonify(serialize_model(user)), 200
        
    except Exception as e:
        db_session.rollback()
        return error_response(str(e), status_code=500)


@auth_bp.delete('/me')
@require_auth
def delete_me():
    """
    Delete current user account.
    
    Requires: Authorization header with Bearer token
    
    Returns:
        204: User deleted
        401: Unauthorized
    """
    try:
        user = get_current_user()
        db_session.delete(user)
        db_session.commit()
        
        return '', 204
        
    except Exception as e:
        db_session.rollback()
        return error_response(str(e), status_code=500)
