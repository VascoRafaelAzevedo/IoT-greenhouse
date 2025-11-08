# Consumer Quick Reference

## Quick Start

### 1. Start Services
```bash
docker compose up postgres mosquitto -d
```

### 2. Run Consumer (Development)
```bash
cd consumer
source ../.env
cargo run
```

### 3. Test with Sample Message
```bash
cd consumer
./test_consumer.sh
```

## Common Commands

### Build
```bash
cargo build              # Debug build
cargo build --release    # Production build
```

### Run
```bash
cargo run                                    # Run with default log level
RUST_LOG=debug cargo run                    # Run with debug logging
RUST_LOG=warn cargo run                     # Run with warnings only
```

### Docker
```bash
docker compose build consumer                # Build image

# Development mode (uses greenhouse_test database with seed data)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up consumer -d
docker compose logs -f consumer

# Production mode (uses greenhouse database)
docker compose up consumer -d                # Run (foreground)
docker compose up consumer -d                # Run (background)
docker compose logs -f consumer              # View logs
docker compose restart consumer              # Restart
docker compose stop consumer                 # Stop
```

### Testing
```bash
# Get greenhouse ID
docker exec gardenaway-postgres psql -U postgres -d greenhouse -c "SELECT id, name FROM greenhouse;"

# Subscribe to MQTT (monitor messages)
mosquitto_sub -h localhost -t "greenhouse/+/telemetry" -v

# Publish test message
mosquitto_pub -h localhost -t "greenhouse/<UUID>/telemetry" -m '{
  "device_id": "<UUID>",
  "timestamp": 1699459200,
  "temperature": 22.5,
  "humidity": 65.0,
  "light": 350.0,
  "tank_level": true,
  "irrigated_since_last_transmission": false,
  "lights_are_on": true,
  "pump_on": false
}'

# Check database
docker exec gardenaway-postgres psql -U postgres -d greenhouse -c \
  "SELECT * FROM telemetry ORDER BY time DESC LIMIT 5;"
```

## Troubleshooting

### Consumer Won't Start
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check MQTT broker is running
docker ps | grep mosquitto

# Verify environment variables
source .env && env | grep -E '(DB_|MQTT_)'

# Check database connection
docker exec gardenaway-postgres pg_isready -U postgres
```

### Messages Not Received
```bash
# Check MQTT broker is accessible
mosquitto_sub -h localhost -t "test" -v

# Check consumer subscribed correctly
# Look for "Subscribing to topic" in logs

# Verify topic matches
# Consumer expects: greenhouse/+/telemetry
# ESP32 publishes: greenhouse/<UUID>/telemetry
```

### Database Errors
```bash
# Check greenhouse exists
docker exec gardenaway-postgres psql -U postgres -d greenhouse -c \
  "SELECT id FROM greenhouse WHERE id = '<UUID>';"

# Check telemetry table
docker exec gardenaway-postgres psql -U postgres -d greenhouse -c \
  "\\d telemetry"

# Check database logs
docker logs gardenaway-postgres --tail 50
```

## Environment Variables

Required:
- `DB_PASSWORD` - Database password

Optional (with defaults):
- `MQTT_HOST=localhost`
- `MQTT_PORT=1883`
- `MQTT_TELEMETRY_TOPIC=telemetry/#`
- `DB_HOST=localhost`
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_NAME=greenhouse`
- `RUST_LOG=info`

## Log Levels

```bash
RUST_LOG=error    # Errors only
RUST_LOG=warn     # Warnings and errors
RUST_LOG=info     # Info, warnings, errors (default)
RUST_LOG=debug    # Debug, info, warnings, errors
RUST_LOG=trace    # Everything (very verbose)
```

## File Structure

```
consumer/
├── Cargo.toml                  # Dependencies
├── Dockerfile                  # Docker build
├── README.md                   # Full documentation
├── DEVELOPMENT_SUMMARY.md      # Development overview
├── test_consumer.sh            # Test script
└── src/
    ├── main.rs                 # Main application
    ├── config.rs               # Configuration
    ├── models.rs               # Data structures
    └── db.rs                   # Database operations
```

## Integration with System

```
ESP32 → MQTT Broker → Consumer → PostgreSQL/TimescaleDB → API → Frontend
```

- **ESP32**: Publishes telemetry every minute
- **Consumer**: Subscribes and stores in database
- **API**: Reads from database for frontend
- **Frontend**: Displays real-time and historical data
