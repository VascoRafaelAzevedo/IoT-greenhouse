# API Documentation

Flask REST API with JWT authentication and MQTT integration for the IoT Greenhouse system.

## Overview

The API serves as the primary interface for user authentication, greenhouse management, and data access. It provides secure endpoints for creating and managing greenhouses, configuring setpoints (which are automatically published to MQTT), and querying telemetry data.

**Key characteristics:**
- JWT-based authentication with user isolation
- Automatic MQTT publishing for setpoint updates
- Read-only endpoints for telemetry and connection events (written by Consumer)
- Input validation with detailed error messages
- CORS support for frontend integration

For setup instructions, see [SETUP.md](SETUP.md).

## Architecture

```
api/
├── src/
│   ├── app.py              # Flask application
│   ├── models.py           # SQLAlchemy models
│   ├── database.py         # Database configuration
│   ├── auth.py             # JWT authentication
│   ├── mqtt_client.py      # MQTT publisher for setpoints
│   ├── validators.py       # Input validation
│   ├── utils.py            # Serialization utilities
│   └── routes/             # API endpoints
│       ├── auth.py         # POST /register, /login, GET/PUT/DEL /me
│       ├── greenhouses.py  # CRUD greenhouses
│       ├── setpoints.py    # GET/PUT setpoints
│       ├── telemetry.py    # GET telemetry (read-only)
│       ├── connections.py  # GET connection events (read-only)
│       ├── plants.py       # GET plant templates (read-only)
│       └── timezones.py    # GET timezones (public)
├── requirements.txt
├── Dockerfile
└── wsgi.py                 # Production entry point
```

## Authentication

All endpoints except `/health`, `/api/auth/register`, `/api/auth/login`, and `/api/timezones` require JWT authentication.

**Required header:**
```
Authorization: Bearer <token>
```

### Endpoints

#### `POST /api/auth/register`
Create new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123",
  "display_name": "John Doe",
  "timezone_id": 1
}
```

**Response 201:** User object + JWT token

#### `POST /api/auth/login`
Authenticate with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepass123"
}
```

**Response 200:** User object + JWT token

#### `GET /api/auth/me`
Get authenticated user information.

#### `PUT /api/auth/me`
Update user profile (optional fields: `display_name`, `timezone_id`).

#### `DELETE /api/auth/me`
Delete user account.

---

## Greenhouses

#### `GET /api/greenhouses`
List authenticated user's greenhouses.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "owner_id": "user-uuid",
    "name": "My Greenhouse",
    "last_seen": "2025-11-03T10:30:00+00:00",
    "created_at": "2025-01-01T12:00:00+00:00"
  }
]
```

#### `GET /api/greenhouses/<id>`
Get greenhouse by ID (owner only).

#### `POST /api/greenhouses`
Create new greenhouse.

**Body:** `{ "name": "Greenhouse Name" }`

#### `PUT /api/greenhouses/<id>`
Update greenhouse name.

#### `DELETE /api/greenhouses/<id>`
Delete greenhouse.

---

## Setpoints

#### `GET /api/greenhouses/<id>/setpoint`
Get greenhouse setpoint configuration.

**Response 200:**
```json
{
  "greenhouse_id": "uuid",
  "target_temp_min": 18.0,
  "target_temp_max": 25.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 60,
  "irrigation_duration_seconds": 30,
  "target_light_intensity": 500.0,
  "changed_at": "2025-11-03T10:30:00+00:00"
}
```

#### `PUT /api/greenhouses/<id>/setpoint`
Update setpoint configuration.

**⚠️ Important:**
- All parameters are required
- Validates value ranges
- **Automatically publishes to MQTT** → `greenhouse/{id}/setpoints`

**Body:**
```json
{
  "target_temp_min": 18.0,
  "target_temp_max": 25.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 60,
  "irrigation_duration_seconds": 30,
  "target_light_intensity": 500.0
}
```

**Validation ranges:**
- `target_temp_min`: 0-40°C
- `target_temp_max`: 0-50°C (must be > min)
- `target_hum_air_max`: 0-100%
- `irrigation_interval_minutes`: 1-1440 (24h max)
- `irrigation_duration_seconds`: 1-600 (10min max)
- `target_light_intensity`: 0-100000 lux

---

## Telemetry (Read-Only)

#### `GET /api/greenhouses/<id>/telemetry`
Get telemetry data with optional filtering.

**Query parameters:**
- `days`: 1-365 (default: 7) - last N days
- `start_date`: ISO date (e.g., 2025-01-01)
- `end_date`: ISO date (e.g., 2025-01-31)
- `limit`: 1-10000 (default: 1000) - max records

**Examples:**
```bash
GET /api/greenhouses/<id>/telemetry              # Last 7 days
GET /api/greenhouses/<id>/telemetry?days=30      # Last 30 days
GET /api/greenhouses/<id>/telemetry?start_date=2025-01-01&end_date=2025-01-31
```

**Response 200:**
```json
{
  "count": 100,
  "data": [
    {
      "time": "2025-11-03T10:30:00+00:00",
      "greenhouse_id": "uuid",
      "sequence": 1,
      "temp_air": 22.5,
      "hum_air": 65.0,
      "lux": 15000.0,
      "light_intensity": 80.0,
      "light_on": true,
      "water_level_ok": true,
      "pump_on": false
    }
  ]
}
```

#### `GET /api/greenhouses/<id>/telemetry/latest`
Get most recent telemetry reading.

---

## Connection Events (Read-Only)

#### `GET /api/greenhouses/<id>/connections`
Get ESP32 connection/disconnection events.

**Query parameters:**
- `limit`: 1-500 (default: 50)

**Response 200:**
```json
{
  "count": 10,
  "data": [
    {
      "id": 1,
      "greenhouse_id": "uuid",
      "start_ts": "2025-11-03T10:00:00+00:00",
      "end_ts": "2025-11-03T10:05:00+00:00"
    }
  ]
}
```

---

## Plant Templates (Read-Only)

#### `GET /api/plants`
List all plant templates.

#### `GET /api/plants/<id>`
Get plant template by ID.

**Response 200:**
```json
{
  "plant_id": "uuid",
  "plant_name": "Tomato",
  "plant_description": "Solanum lycopersicum",
  "target_temp_min": 18.0,
  "target_temp_max": 27.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 120,
  "irrigation_duration_seconds": 45,
  "target_light_intensity": 20000.0
}
```

---

## Timezones (Public)

#### `GET /api/timezones`
List all available timezones (no authentication required).

---

## MQTT Integration

When setpoints are updated via `PUT /api/greenhouses/<id>/setpoint`, the API automatically publishes to MQTT.

**Topic:** `greenhouse/{greenhouse_id}/setpoints`

**Payload:**
```json
{
  "target_temp_min": 18.0,
  "target_temp_max": 25.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 60,
  "irrigation_duration_seconds": 30,
  "target_light_intensity": 500.0,
  "changed_at": "2025-11-03T10:30:00+00:00"
}
```

ESP32 subscribes to this topic and updates control parameters.

---

## Security

- **Passwords:** Hashed with bcrypt
- **JWT tokens:** Expire in 30 days (configurable via `JWT_EXP_DAYS`)
- **Authorization:** Users can only access their own resources
- **CORS:** Configurable via `CORS_ALLOWED_ORIGINS`

(still to review/implement)

---

## Important Notes

1. **Telemetry and Connection Events are read-only** via API
   - Written by Rust Consumer via MQTT

2. **Setpoints write to database AND publish to MQTT**
   - ESP32 receives new values automatically

3. **All timestamps are UTC (ISO 8601)**
   - Frontend must convert to user's timezone

4. **Backend validates all inputs**
   - Frontend should also validate for better UX


---

## Testing

Example requests using curl:

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","display_name":"Test User","timezone_id":1}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use token
TOKEN="eyJ0eXAiOiJKV1Qi..."
curl http://localhost:5000/api/greenhouses -H "Authorization: Bearer $TOKEN"
```

For complete setup and testing procedures, see [SETUP.md](SETUP.md).

## Related Documentation

- [Database Schema](DATABASE.md) - Table structure and relationships
- [ESP32 Firmware](ESP32.md) - MQTT message formats and topics
- [Setup Guide](SETUP.md) - Installation and configuration

## References

- [Flask Documentation](https://flask.palletsprojects.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [PyJWT](https://pyjwt.readthedocs.io/)
