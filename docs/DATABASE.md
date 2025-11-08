# Database Documentation

PostgreSQL 17 with TimescaleDB extension for time-series optimization.

## Overview

The database serves as the central data store for all greenhouse telemetry, user accounts, and configuration. It uses PostgreSQL for relational data integrity and TimescaleDB for efficient time-series queries on telemetry data.

**Key features:**
- Dual-database setup (production + testing)
- Timezone support for user preferences

For in depth setup instructions, see [SETUP.md](SETUP.md).

## Schema Overview

```mermaid
erDiagram
    APP_USER ||--o{ GREENHOUSE : owns
    GREENHOUSE ||--|| SETPOINT : has
    GREENHOUSE ||--o{ TELEMETRY : records
    GREENHOUSE ||--o{ CONNECTION_EVENT : logs
    PLANT ||--o{ SETPOINT : template_for
    TIMEZONE ||--o{ APP_USER : uses

    APP_USER {
        uuid user_id PK
        text email UK
        text password_hash
        text display_name
        int timezone_id FK
        timestamptz created_at
    }

    GREENHOUSE {
        uuid greenhouse_id PK
        uuid owner_id FK
        text name
        timestamptz last_seen
        timestamptz created_at
    }

    SETPOINT {
        uuid greenhouse_id PK_FK
        float target_temp_min
        float target_temp_max
        float target_hum_air_max
        int irrigation_interval_minutes
        int irrigation_duration_seconds
        float target_light_intensity
        timestamptz changed_at
    }

    TELEMETRY {
        timestamptz time PK
        uuid greenhouse_id PK_FK
        int sequence
        float temp_air
        float hum_air
        float lux
        float light_intensity
        bool light_on
        bool water_level_ok
        bool pump_on
    }

    CONNECTION_EVENT {
        bigserial id PK
        uuid greenhouse_id FK
        timestamptz start_ts
        timestamptz end_ts
    }

    PLANT {
        uuid plant_id PK
        text plant_name UK
        text plant_description
        float target_temp_min
        float target_temp_max
        float target_hum_air_max
        int irrigation_interval_minutes
        int irrigation_duration_seconds
        float target_light_intensity
    }

    TIMEZONE {
        int timezone_id PK
        text name UK
        text abbreviation
        int utc_offset_minutes
    }
```

## Tables

### `app_user`
User accounts with authentication.

**Key fields:**
- `user_id` (UUID) - Primary key
- `email` (unique) - Login identifier
- `password_hash` - bcrypt hashed
- `timezone_id` - References `timezone` table

### `greenhouse`
Greenhouses owned by users.

**Key fields:**
- `greenhouse_id` (UUID) - Primary key
- `owner_id` - References `app_user`
- `last_seen` - Updated by MQTT keepalive

**Constraints:**
- Users can only access their own greenhouses
- Deleting user cascades to greenhouses

### `setpoint`
Control parameters for greenhouse (1:1 with greenhouse).

**Key fields:**
- Temperature range (min/max in °C)
- Humidity maximum (%)
- Irrigation timing (interval + duration)
- Light intensity target (lux)

**Important:**
- Changes published to MQTT automatically by API
- ESP32 subscribes to updates

### `telemetry`
Time-series sensor readings (TimescaleDB hypertable).

**Key fields:**
- `time` - Timestamp (part of composite PK)
- `greenhouse_id` - UUID (part of composite PK)
- `sequence` - Message counter from ESP32
- Environmental data (temp, humidity, light)
- Actuator states (pump, LED, etc.)

**Optimization:**
- Partitioned by time for efficient queries
- Compressed after 7 days
- Retention policy: 1 year

### `connection_event`
ESP32 connection/disconnection log.

**Key fields:**
- `start_ts` - Connection timestamp
- `end_ts` - Disconnection timestamp (NULL if active)

**Purpose:**
- Track greenhouse uptime
- Detect connectivity issues

### `plant`
Template configurations for common plants (read-only).

**Seeded data:**
- Tomato, Lettuce, Basil
- Pre-configured setpoints

**Usage:**
- Users can copy templates to their setpoints
- Speeds up greenhouse configuration

### `timezone`
IANA timezone database (read-only).

**Purpose:**
- Store user timezone preference
- Convert UTC timestamps in frontend

## Database Modes

The system supports two database configurations:

### Production Database: `greenhouse`

**Contains:**
- ✓ Schema
- ✓ 26 timezones (UTC-11 to UTC+14)
- ✓ 15 plant templates (Tomato, Lettuce, Cucumber, Basil, etc.)
- ✗ No users, greenhouses, or telemetry (clean database)

**Use for:**
- Production deployment
- Clean environment for new users
- Real-world operation

### Test Database: `greenhouse_test`

**Contains:**
- ✓ Schema (with slight differences: includes `target_hum_air_min` field)
- ✓ 26 timezones
- ✓ 15 plant templates
- ✓ 2 test users (vasco@example.com, maria@example.com)
- ✓ 4 test greenhouses
- ✓ 4 setpoints
- ✓ 10 connection events
- ✓ 10 telemetry records

**Use for:**
- Integration tests
- Development with sample data
- CI pipeline

See [SETUP.md](SETUP.md) for instructions on switching databases and resetting test data.

## Initialization

Databases are created automatically by `docker compose up postgres`. Or when genral docjer compose file is used

**Initialization scripts:**
1. `01-schema.sql` - Tables, indexes, constraints
2. `02-seed-data.sql` - Timezones, plants, sample user

**Both scripts run on:**
- `greenhouse` database (full initialization)
- `greenhouse_test` database (schema only via conditional logic)

For detailed setup procedures, see [SETUP.md](SETUP.md).

## Data Flow

```
ESP32 → MQTT Broker → Rust Consumer → PostgreSQL (telemetry, connections)
                                    ↓
User → API → PostgreSQL (users, greenhouses, setpoints)
           ↓
           MQTT Broker → ESP32 (setpoint updates)
```

**Read-only via API:**
- Telemetry
- Connection events
- Plant templates
- Timezones

**Read-write via API:**
- Users
- Greenhouses
- Setpoints (writes also publish to MQTT)

See [API.md](API.md) for endpoint details and [ESP32.md](ESP32.md) for MQTT message formats.


## Common Operations

### Reset Test Database
```bash
docker compose exec postgres psql -U postgres << EOF
DROP DATABASE IF EXISTS greenhouse_test;
CREATE DATABASE greenhouse_test;
\c greenhouse_test
\i /docker-entrypoint-initdb.d/01-schema.sql
EOF
```

### Verify Active Database
```bash
curl http://localhost:5000/health | jq '.current_db, .using_test_db'
```

### Query Recent Telemetry
```sql
SELECT time, temp_air, hum_air, lux 
FROM telemetry 
WHERE greenhouse_id = 'uuid-here' 
  AND time > NOW() - INTERVAL '1 day'
ORDER BY time DESC 
LIMIT 100;
```

### Check Greenhouse Uptime
```sql
SELECT 
    greenhouse_id,
    COUNT(*) as connections,
    SUM(EXTRACT(EPOCH FROM (COALESCE(end_ts, NOW()) - start_ts))) / 3600 as uptime_hours
FROM connection_event
WHERE start_ts > NOW() - INTERVAL '7 days'
GROUP BY greenhouse_id;
```

## Notes

- **All timestamps are UTC** - conversion happens in frontend
- **TimescaleDB partitions data by week** - optimizes queries by time range
- **Foreign key cascades** - deleting user removes all related data
- **Never use test database in production** - no authentication safety net
- **Telemetry writes bypass API** - only Rust consumer writes via MQTT

## Related Documentation

- [API Endpoints](API.md) - How to query and manipulate data
- [ESP32 Firmware](ESP32.md) - Data collection and MQTT publishing
- [CI/CD Pipeline](CI_PIPELINE.md) - Database testing procedures

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
