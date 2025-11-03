from datetime import datetime
from uuid import UUID


def serialize_model(obj):
    """
    Serialize SQLAlchemy model instance to dictionary.
    Handles UUID and datetime objects.
    """
    if obj is None:
        return None
    
    result = {}
    for column in obj.__table__.columns:
        try:
            value = getattr(obj, column.name)
            
            # Handle different types
            if isinstance(value, UUID):
                result[column.name] = str(value)
            elif isinstance(value, datetime):
                # Convert timezone-aware datetime to UTC ISO format
                result[column.name] = value.replace(tzinfo=None).isoformat() + 'Z' if value else None
            elif value is None:
                result[column.name] = None
            else:
                # Force string conversion for any problematic type
                try:
                    # Test if value is JSON serializable
                    import json
                    json.dumps(value)
                    result[column.name] = value
                except (TypeError, ValueError):
                    result[column.name] = str(value)
        except Exception as e:
            # Skip problematic fields
            result[column.name] = None
    
    return result


def serialize_list(objects):
    """Serialize a list of SQLAlchemy model instances"""
    return [serialize_model(obj) for obj in objects]


def error_response(message, details=None, status_code=400):
    """
    Create standardized error response.
    
    Args:
        message: Main error message
        details: Optional dict with detailed validation errors
        status_code: HTTP status code
        
    Returns:
        Tuple of (json_dict, status_code)
    """
    response = {"error": message}
    if details:
        response["details"] = details
    return response, status_code


def success_response(data, status_code=200):
    """
    Create standardized success response.
    
    Args:
        data: Data to return
        status_code: HTTP status code
        
    Returns:
        Tuple of (data, status_code)
    """
    return data, status_code
