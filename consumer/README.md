# MQTT Consumer (Rust)

This service subscribes to MQTT telemetry messages from ESP32 devices and stores them in TimescaleDB.

## Features

- ✅ Subscribes to `greenhouse/+/telemetry` MQTT topic
- ✅ Parses JSON telemetry messages from ESP32 devices
- ✅ Validates greenhouse UUID and message structure
- ✅ Inserts telemetry data into PostgreSQL/TimescaleDB
- ✅ Updates greenhouse `last_seen` timestamp
- ✅ Automatic reconnection on connection failures
- ✅ Structured logging with configurable levels
- ✅ Environment-based configuration

## Architecture

```
ESP32 → MQTT Broker → Consumer → PostgreSQL/TimescaleDB
```

## Configuration

The consumer uses environment variables from `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `MQTT_HOST` | MQTT broker hostname | `localhost` |
| `MQTT_PORT` | MQTT broker port | `1883` |
| `MQTT_TELEMETRY_TOPIC` | MQTT topic to subscribe | `greenhouse/+/telemetry` |
| `DB_HOST` | PostgreSQL hostname | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | **(required)** |
| `DB_NAME` | Database name | `greenhouse` |
| `RUST_LOG` | Log level | `info` |

## Development

### Build
```bash
cd consumer
cargo build
```

### Run (local development)
```bash
# Make sure PostgreSQL and MQTT broker are running
docker compose up postgres mosquitto -d

# Set environment variables
export DB_PASSWORD=change_me_strong_pass
export MQTT_HOST=localhost
export DB_HOST=localhost

# Run consumer
cargo run
```

### Build for Docker
```bash
docker compose build consumer
```

### Run in Docker
```bash
# For development (uses greenhouse_test database with seed data)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up consumer -d
docker compose logs -f consumer

# For production (uses greenhouse database)
docker compose up consumer -d
docker compose logs -f consumer
```

## Testing

### Send test message
```bash
# Install mosquitto-clients
sudo apt-get install mosquitto-clients

# Publish test telemetry (replace with valid greenhouse UUID from DB)
mosquitto_pub -h localhost -t "greenhouse/123e4567-e89b-12d3-a456-426614174000/telemetry" -m '{
  "device_id": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": 1699459200,
  "temperature": 22.5,
  "humidity": 65.0,
  "light": 350.0,
  "tank_level": true,
  "irrigated_since_last_transmission": false,
  "lights_are_on": true,
  "pump_on": false
}'
```

## Message Format

Expected JSON payload from ESP32:

```json
{
  "device_id": "greenhouse-uuid",
  "timestamp": 1699459200,
  "temperature": 22.5,
  "humidity": 65.0,
  "light": 350.0,
  "tank_level": true,
  "irrigated_since_last_transmission": false,
  "lights_are_on": true,
  "pump_on": false
}
```

**Note:** `temperature`, `humidity`, and `light` are optional fields.

## Database Schema

Telemetry is stored in the `telemetry` table (TimescaleDB hypertable):

- `time` - Timestamp (from ESP32)
- `greenhouse_id` - UUID reference to greenhouse
- `sequence` - Auto-incrementing sequence per greenhouse/timestamp
- `temp_air` - Air temperature (°C)
- `hum_air` - Air humidity (%)
- `lux` - Light intensity (lux)
- `light_intensity` - Light intensity (same as lux)
- `light_on` - LED lights status
- `water_level_ok` - Tank water level
- `pump_on` - Water pump status

## Error Handling

- **Invalid JSON**: Logged and skipped
- **Invalid UUID**: Logged and skipped
- **Unknown greenhouse**: Logged and skipped (not inserted)
- **Database errors**: Logged, continues processing
- **MQTT disconnection**: Automatic reconnection every 5 seconds

## Logging

Set `RUST_LOG` environment variable:

```bash
RUST_LOG=debug cargo run  # Verbose logging
RUST_LOG=info cargo run   # Standard logging (default)
RUST_LOG=warn cargo run   # Warnings and errors only
```

## Performance

- Async/await architecture using Tokio runtime
- Non-blocking database operations
- QoS 1 (at least once) message delivery
- Clean session for MQTT (no persistent subscriptions)

## Future Enhancements

- [ ] Connection pool for database
- [ ] Metrics and monitoring (Prometheus)
- [ ] Dead letter queue for failed inserts
- [ ] Batched inserts for higher throughput
- [ ] Support for setpoint updates via MQTT
- [ ] Command publishing back to ESP32
