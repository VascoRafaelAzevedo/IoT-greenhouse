# Setup & Installation

Complete guide to get the GardenAway IoT System running locally using Docker and Docker Compose.

## Prerequisites

Ensure the following are installed:

- **Docker** (latest stable) - [Installation guide](https://docs.docker.com/get-docker/)
- **Docker Compose** - [Installation guide](https://docs.docker.com/compose/install/)
- **Git** - For cloning the repository
- **Code editor** - VSCode recommended because of PlatformIO

**Network requirements:**
- Ports available: `5432` (PostgreSQL), `1883` (MQTT), `5000` (API)
- For remote deployment, configure firewall rules accordingly

## Environment Configuration

The project uses environment variables defined in a `.env` file at the project root.

### Create Environment File

```bash
# Copy example configuration
cp .env.example .env

# Edit with your values
nano .env
```

### Key Variables

```properties
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_NAME=greenhouse
DB_NAME_TEST=greenhouse_test

# API
API_SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
JWT_EXP_DAYS=30
CORS_ALLOWED_ORIGINS=*

# MQTT
MQTT_HOST=mosquitto
MQTT_PORT=1883
MQTT_USER=your-mqtt-username
MQTT_PASSWORD=your-mqtt-password
```

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd IoT-greenhouse
```

### 2. Start Infrastructure Services

Start PostgreSQL and MQTT broker first:

```bash
docker compose up -d postgres mosquitto
```

Wait ~10 seconds for services to initialize.

### 3. Verify Database

```bash
# Check container status
docker compose ps

# Connect to database
docker compose exec postgres psql -U postgres -d greenhouse

# Inside psql, list tables
\dt

# Exit
\q
```

You should see 7 tables: `timezone`, `app_user`, `greenhouse`, `setpoint`, `telemetry`, `connection_event`, `plant`.

### 4. Verify MQTT Broker

```bash
# Test subscription (run in one terminal)
docker compose exec mosquitto mosquitto_sub -h localhost -t "test/topic" -u $MQTT_USER -P $MQTT_PASSWORD

# Publish message (run in another terminal)
docker compose exec mosquitto mosquitto_pub -h localhost -t "test/topic" -m "Hello MQTT" -u $MQTT_USER -P $MQTT_PASSWORD
```

The subscriber should receive the message.

### 5. Start Application Services

```bash
docker compose up -d api consumer
```

### 6. Verify API

```bash
# Health check
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "ok",
#   "current_db": "greenhouse",
#   "using_test_db": false,
#   "timestamp": "2025-11-08T12:00:00.000000"
# }
```

## Development Setup

For local development without Docker:

### Python API

```bash
# Navigate to project root
cd /path/to/IoT-greenhouse

# Activate virtual environment
source .venv/bin/activate

# Install dependencies
cd api
pip install -r requirements.txt

# Test database connection
python test_db_connection.py

# Run development server
python test_api.py
```

API runs at `http://localhost:5000`

### Rust Consumer

```bash
cd consumer

# Run tests
cargo test

# Build release
cargo build --release

# Run locally (requires MQTT and DB running)
cargo run
```

## Testing the System

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "display_name": "Test User",
    "timezone_id": 1
  }'
```

Save the returned `token` for authenticated requests.

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Authenticated Requests

```bash
# Set token from login response
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

# Get user profile
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# List greenhouses
curl http://localhost:5000/api/greenhouses \
  -H "Authorization: Bearer $TOKEN"

# Create greenhouse
curl -X POST http://localhost:5000/api/greenhouses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Greenhouse"}'
```

### Test MQTT Integration

```bash
# Subscribe to setpoint updates
docker compose exec mosquitto mosquitto_sub \
  -h localhost \
  -t "greenhouse/+/setpoints" \
  -u $MQTT_USER -P $MQTT_PASSWORD

# In another terminal, update a setpoint via API
# (This will publish to MQTT automatically)
curl -X PUT http://localhost:5000/api/greenhouses/<greenhouse-id>/setpoint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_temp_min": 18.0,
    "target_temp_max": 25.0,
    "target_hum_air_max": 70.0,
    "irrigation_interval_minutes": 60,
    "irrigation_duration_seconds": 30,
    "target_light_intensity": 500.0
  }'
```

You should see the MQTT message published to the subscribed topic.

## Database Modes

The system supports two database configurations:

### Production Database (`greenhouse`)
- Default mode
- Contains seed data: timezones, plant templates, sample users
- Use for development and production

### Test Database (`greenhouse_test`)
- Activated via `USE_TEST_DB=true` environment variable
- Empty schema without seed data
- Used in CI/CD pipeline
- Ideal for integration tests

**Switch to test database:**
```bash
# Add to .env
USE_TEST_DB=true

# Restart services
docker compose restart api consumer
```

**Reset test database:**
```bash
docker compose exec postgres psql -U postgres << EOF
DROP DATABASE IF EXISTS greenhouse_test;
CREATE DATABASE greenhouse_test;
\c greenhouse_test
\i /docker-entrypoint-initdb.d/01-schema.sql
EOF
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs postgres
docker compose logs mosquitto
docker compose logs api
docker compose logs consumer

# Restart specific service
docker compose restart api
```

### Database Connection Failed

```bash
# Verify database is running
docker compose ps

# Check connection from API
cd api
python test_db_connection.py

# Verify credentials in .env match database
```

### MQTT Connection Issues

```bash
# Check Mosquitto logs
docker compose logs mosquitto

# Verify credentials
docker compose exec mosquitto cat /mosquitto/config/mosquitto.conf

# Test connection manually
mosquitto_pub -h localhost -t test -m "hello" -u $MQTT_USER -P $MQTT_PASSWORD
```

### API Returns 500 Errors

```bash
# Check API logs
docker compose logs api

# Verify database connection
curl http://localhost:5000/health

# Restart API
docker compose restart api
```

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process or change API port in docker-compose.yml
```

## Cleanup

### Stop Services

```bash
# Stop all containers
docker compose down

# Stop and remove volumes (deletes data)
docker compose down -v
```

### Reset Everything

```bash
# Remove containers, networks, volumes, and images
docker compose down -v --rmi all

# Start fresh
docker compose up -d
```

## Next Steps

- **API Usage**: See [API.md](API.md) for complete endpoint documentation
- **Database Schema**: See [DATABASE.md](DATABASE.md) for table structures
- **ESP32 Setup**: See [ESP32.md](ESP32.md) for firmware configuration
- **CI/CD**: See [CI_PIPELINE.md](CI_PIPELINE.md) for testing procedures

## References

- [Docker Compose CLI Reference](https://docs.docker.com/compose/reference/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Eclipse Mosquitto Docker Image](https://hub.docker.com/_/eclipse-mosquitto)
