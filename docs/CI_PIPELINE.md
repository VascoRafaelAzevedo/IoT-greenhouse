# CI/CD Pipeline

GitHub Actions automated testing pipeline for the IoT Greenhouse project.

## Overview

The CI/CD pipeline validates all components of the system on every push to `main` or `develop` branches. It ensures database integrity, API functionality, MQTT connectivity, and comprehensive consumer validation.

For local testing procedures, see [SETUP.md](SETUP.md).

## What It Tests

```
┌─────────────┐
│   GitHub    │
│   Actions   │
└──────┬──────┘
       │
       ├─> Database (PostgreSQL + TimescaleDB)
       ├─> MQTT Broker (Mosquitto)
       ├─> API (Flask)
       └─> Consumer (Rust)
```

## Pipeline Flow

### 1. Setup (2-3 min)
- Checkout code
- Build Docker images (parallel)
- Start services with **test database** (`greenhouse_test`)

### 2. Database Validation (30 sec)

**Schema check:** All 7 tables exist
```
timezone, app_user, greenhouse, setpoint, 
connection_event, telemetry, plants
```

**Seed data check:** Exact row counts
```
timezone:          26 rows
app_user:           2 rows
greenhouse:         4 rows  
plants:            15 rows
setpoint:           4 rows
connection_event:  10 rows
telemetry:         10 rows
```

**Why:** Ensures consistent test environment.

### 3. Infrastructure Health (10 sec)

- **API:** `/health` endpoint responds
- **MQTT:** Pub/sub test succeeds

### 4. Consumer Tests (40 sec)

#### Code Quality
```bash
cargo fmt --check   # Style enforcement
cargo clippy        # Linting (warnings = errors)
```

#### Unit Tests (30 tests)
Tests validation logic for:
- Temperature: -50°C to 100°C
- Humidity: 0% to 100%
- Light: 0 to 100,000 lux
- Timestamps: must be past (60s tolerance)
- UUIDs: must be v4
- Sequences: must be positive

**Examples:**
- ✓ Valid: `{"temp_air": 24.5}`
- ✗ Invalid: `{"temp_air": 150}` (out of range)
- ✗ Invalid: `{"temp_air": "hot"}` (wrong type)

#### Integration Tests (21 tests)

**Script:** `consumer/test_consumer_ci.sh`

**Valid message tests (6):**
- Complete message
- Minimal message (optional fields omitted)
- Boundary values

**Invalid message tests (14):**
- Out of range values
- Wrong types
- Invalid UUIDs (wrong version, malformed)
- Future timestamps
- Missing required fields
- Malformed JSON

**Database verification:**
```bash
# Before tests: Count rows
BEFORE = SELECT count(*) FROM telemetry

# Run tests (publish MQTT messages)

# After tests: Verify changes
AFTER = SELECT count(*) FROM telemetry
DIFF = AFTER - BEFORE

# Should accept ~6 valid, reject ~14 invalid
if DIFF < 5:  warn "Rejecting valid messages"
if DIFF > 30: fail "Accepting invalid messages"
```

**Deduplication test:**
- Publish same message twice
- Check logs for "Duplicate telemetry ignored"

**Reconnection test:**
- Restart MQTT broker
- Consumer must reconnect automatically

### 5. Cleanup
Always runs (even on failure):
```bash
docker compose down -v  # Remove containers + volumes
```

## Test Summary

| Component | Tests | What |
|-----------|-------|------|
| Consumer | 30 unit | Validation logic |
| Consumer | 21 integration | End-to-end MQTT → DB |
| Database | 13 checks | Schema + seed data |
| MQTT | 2 checks | Pub/sub + reconnect |
| API | 1 check | Health endpoint |

**Total:** 67 automated checks in ~6 minutes

## Running Locally

### Full simulation (exact CI behavior)
```bash
# Start services with test database
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run tests
cd consumer
cargo test --lib
./test_consumer_ci.sh

# Cleanup
cd ..
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

### Quick consumer-only tests
```bash
# Assumes services already running
cd consumer
cargo test            # Unit tests
./test_consumer_ci.sh # Integration tests
```

## Debugging Failures

### Check consumer logs
```bash
docker logs gardenaway-consumer
```

### Check database
```bash
# Tables exist?
docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c "\dt"

# Seed data loaded?
docker exec gardenaway-postgres psql -U postgres -d greenhouse_test \
  -c "SELECT count(*) FROM telemetry"
```

### Test MQTT manually
```bash
# Publish
mosquitto_pub -h localhost -t test -m "hello"

# Subscribe
mosquitto_sub -h localhost -t test -C 1
```

You can also use MQTTX, it one of the tools used during the development and testing of the project for easier visualization and interaction with topics.

## Key Differences from Production

CI uses **development mode** overlay (`docker-compose.dev.yml`):

```yaml
# CI/Development
DB_NAME: greenhouse_test   # Empty except seed data
RUST_LOG: debug           # Verbose logging

# Production
DB_NAME: greenhouse       # Real user data
RUST_LOG: info           # Less verbose
```

See [DATABASE.md](DATABASE.md) for details on database modes.

## Notes

- **All timestamps UTC** - no timezone conversion
- **Test database wiped** after every run
- **No credentials in code** - uses `.env.example`
- **30 unit tests** run in Rust (fast)
- **21 integration tests** run via bash (slower)
- **Fails fast** - stops on first critical error

## Related Documentation

- [Setup Guide](SETUP.md) - Local testing procedures
- [Database Schema](DATABASE.md) - Test database structure
- [API Documentation](API.md) - Health check endpoint

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose CLI](https://docs.docker.com/compose/reference/)
- [Rust Testing Guide](https://doc.rust-lang.org/book/ch11-00-testing.html)
