"""Validation functions for API endpoints"""


def validate_setpoint(data):
    """
    Validate setpoint data.
    
    Returns:
        (is_valid: bool, errors: dict or None)
    """
    errors = {}
    
    # Required fields
    required_fields = [
        'target_temp_min',
        'target_temp_max',
        'target_hum_air_max',
        'irrigation_interval_minutes',
        'irrigation_duration_seconds',
        'target_light_intensity'
    ]
    
    for field in required_fields:
        if field not in data or data[field] is None:
            errors[field] = f"{field} is required"
    
    # If missing required fields, return early
    if errors:
        return False, errors
    
    # Validate ranges
    target_temp_min = data['target_temp_min']
    target_temp_max = data['target_temp_max']
    target_hum_air_max = data['target_hum_air_max']
    irrigation_interval = data['irrigation_interval_minutes']
    irrigation_duration = data['irrigation_duration_seconds']
    target_light = data['target_light_intensity']
    
    # Temperature validation
    if not (0 <= target_temp_min <= 40):
        errors['target_temp_min'] = "Must be between 0°C and 40°C"
    
    if not (0 <= target_temp_max <= 50):
        errors['target_temp_max'] = "Must be between 0°C and 50°C"
    
    if target_temp_max <= target_temp_min:
        errors['target_temp_max'] = "Must be greater than target_temp_min"
    
    # Humidity validation
    if not (0 <= target_hum_air_max <= 100):
        errors['target_hum_air_max'] = "Must be between 0% and 100%"
    
    # Irrigation validation
    if not (1 <= irrigation_interval <= 1440):
        errors['irrigation_interval_minutes'] = "Must be between 1 and 1440 minutes (24 hours)"
    
    if not (1 <= irrigation_duration <= 600):
        errors['irrigation_duration_seconds'] = "Must be between 1 and 600 seconds (10 minutes)"
    
    # Light intensity validation
    if not (0 <= target_light <= 100000):
        errors['target_light_intensity'] = "Must be between 0 and 100000 lux"
    
    if errors:
        return False, errors
    
    return True, None


def validate_user_registration(data):
    """
    Validate user registration data.
    
    Returns:
        (is_valid: bool, errors: dict or None)
    """
    errors = {}
    
    # Required fields
    if 'email' not in data or not data['email']:
        errors['email'] = "Email is required"
    elif '@' not in data['email']:
        errors['email'] = "Invalid email format"
    
    if 'password' not in data or not data['password']:
        errors['password'] = "Password is required"
    elif len(data['password']) < 8:
        errors['password'] = "Password must be at least 8 characters"
    
    if 'display_name' not in data or not data['display_name']:
        errors['display_name'] = "Display name is required"
    
    if 'timezone_id' not in data or data['timezone_id'] is None:
        errors['timezone_id'] = "Timezone is required"
    
    if errors:
        return False, errors
    
    return True, None


def validate_greenhouse_create(data):
    """
    Validate greenhouse creation data.
    
    Returns:
        (is_valid: bool, errors: dict or None)
    """
    errors = {}
    
    if 'name' not in data or not data['name'] or data['name'].strip() == '':
        errors['name'] = "Greenhouse name is required"
    
    if errors:
        return False, errors
    
    return True, None


def validate_telemetry_query(days=None, start_date=None, end_date=None, limit=None):
    """
    Validate telemetry query parameters.
    
    Returns:
        (is_valid: bool, errors: dict or None)
    """
    errors = {}
    
    if days is not None:
        try:
            days_int = int(days)
            if days_int < 1 or days_int > 365:
                errors['days'] = "Days must be between 1 and 365"
        except ValueError:
            errors['days'] = "Days must be a valid integer"
    
    if limit is not None:
        try:
            limit_int = int(limit)
            if limit_int < 1 or limit_int > 10000:
                errors['limit'] = "Limit must be between 1 and 10000"
        except ValueError:
            errors['limit'] = "Limit must be a valid integer"
    
    if errors:
        return False, errors
    
    return True, None
