# CI/CD Pipeline Documentation

## Overview

The GitHub Actions CI/CD pipeline provides comprehensive automated testing for the IoT Greenhouse project, with special emphasis on the MQTT consumer component. The pipeline runs on every push and pull request to `main` and `develop` branches.

## Pipeline Architecture

### Environment
- **Runner**: `ubuntu-latest`
- **Database**: PostgreSQL 14 with TimescaleDB 2.15.2
- **MQTT Broker**: Eclipse Mosquitto
- **Test Database**: `greenhouse_test` (pre-seeded with test data)
- **Container Orchestration**: Docker Compose with dev overlay

### Test Modes

The pipeline uses **development mode** (`docker-compose.dev.yml` overlay) which:
- Uses `greenhouse_test` database instead of `greenhouse`
- Enables debug logging
- Provides access to seeded test data
- Prevents pollution of production database

## Pipeline Stages

### 1. Setup & Build (Steps 1-3)
```yaml
- Checkout code
- Setup Docker Buildx
- Copy environment configuration
```

**Purpose**: Prepare the build environment

### 2. Service Deployment (Step 4-5)
```yaml
- Build all Docker images in parallel
- Start: postgres, mosquitto, api, consumer
```

**Purpose**: Deploy the full stack in test mode

**Key Feature**: Uses both `docker-compose.yml` and `docker-compose.dev.yml` to ensure services connect to `greenhouse_test` database.

### 3. Database Validation (Steps 6-9)

#### Health Check
Waits up to 75 seconds for PostgreSQL to be healthy.

#### Extension Verification
Confirms TimescaleDB extension is installed.

#### Table Structure Validation
Verifies all required tables exist:
- `timezone`
- `app_user`
- `greenhouse`
- `setpoint`
- `connection_event`
- `telemetry`
- `plants`

#### Seed Data Validation
**Strict row count verification** to ensure test database is properly seeded:

| Table | Expected Rows |
|-------|---------------|
| timezone | 26 |
| app_user | 2 |
| greenhouse | 4 |
| plants | 15 |
| setpoint | 4 |
| connection_event | 10 |
| telemetry | 10 |

**Purpose**: Guarantees consistent test environment and detects database initialization issues.

### 4. API & MQTT Validation (Steps 10-11)

#### API Health Check
- Polls `/health` endpoint for up to 30 seconds
- Verifies API is accepting requests

#### MQTT Broker Smoke Test
- Publishes message to `ci/test` topic
- Subscribes and verifies message receipt
- Confirms pub/sub functionality

**Purpose**: Ensures infrastructure is fully operational before consumer tests.

### 5. Consumer Testing Suite

#### 5.1 Rust Toolchain Setup
```yaml
- Install stable Rust toolchain
- Install rustfmt and clippy
```

#### 5.2 Code Quality Checks

**Formatting** (`cargo fmt --check`)
- Enforces Rust style guidelines
- Fails if code is not formatted

**Linting** (`cargo clippy -- -D warnings`)
- Static analysis for code quality
- Treats warnings as errors
- Catches common mistakes and anti-patterns

#### 5.3 Unit Tests (`cargo test --lib`)
Runs **30 unit tests** covering:

**Validation Tests:**
- Temperature range: -50°C to 100°C
- Humidity range: 0% to 100%
- Light range: 0 to 100,000 lux
- Light intensity: 0% to 100% (optional)
- Timestamp: must be past (allows 60s clock skew)
- Sequence: must be positive
- UUID: must be version 4

**Edge Cases:**
- Boundary values (exactly at limits)
- Just outside boundaries
- Extreme values
- Type mismatches
- Missing required fields
- Malformed JSON
- Invalid UUID versions

**See**: `consumer/TESTING.md` for complete test documentation.

#### 5.4 Consumer Runtime Verification

**Container Check**
- Verifies consumer Docker container is running
- Shows logs if container failed

**MQTT Connection Wait**
- Polls consumer logs for "MQTT connected" message
- Waits up to 40 seconds
- Fails pipeline if consumer cannot connect

**Purpose**: Ensures consumer is operational before integration tests.

#### 5.5 Database State Snapshot

**Before Tests:**
```bash
SELECT count(*) FROM telemetry
SELECT count(*) FROM connection_event
```

Stores counts in environment variables: `BEFORE_TELEMETRY`, `BEFORE_CONNECTIONS`

**Purpose**: Establish baseline to measure test impact on database.

#### 5.6 Integration Tests

**Script**: `consumer/test_consumer_ci.sh`

**CI-Optimized Features:**
- Detects `CI=true` environment variable
- Disables color codes for cleaner logs
- Enhanced error reporting
- Automatic prerequisite validation

**Test Categories:**

1. **MQTT Broker Functionality**
   - Pub/sub test on unique topic
   - Verifies broker is operational
   - Independent of consumer

2. **Consumer MQTT Connection**
   - Checks logs for connection message
   - Verifies consumer subscribed to topics

3. **Valid Message Tests** (~6 tests)
   - Complete message with all fields
   - Minimal message (optional fields omitted)
   - Boundary values (temperature, humidity, light)
   - Should be accepted and stored in database

4. **Invalid Message Tests** (~14 tests)
   - Out-of-range values
   - Invalid types (string for number, number for boolean)
   - Invalid UUIDs (wrong version, nil, malformed)
   - Invalid timestamps (zero, negative, future)
   - Missing required fields
   - Malformed JSON
   - Should be rejected with validation errors

5. **Duplicate Detection Test**
   - Publishes same message twice (same timestamp + sequence)
   - Verifies deduplication in logs
   - Tests primary key enforcement

**Total**: ~21 integration tests

**Verification:**
- Counts validation errors in logs
- Counts successful insertions
- Warns if counts don't match expectations

#### 5.7 Database Impact Verification

**After Tests:**
```bash
SELECT count(*) FROM telemetry
SELECT count(*) FROM connection_event
```

**Validation Logic:**
```bash
TELEMETRY_DIFF = AFTER - BEFORE

# Should have added ~6 valid messages
if TELEMETRY_DIFF < 10:
  warn "Consumer may be rejecting valid messages"

if TELEMETRY_DIFF > 30:
  fail "Consumer accepting invalid messages"
```

**Purpose**: Ensures validation is working correctly by analyzing database changes.

#### 5.8 Duplicate Message Verification

Checks consumer logs for:
```
Duplicate telemetry ignored for greenhouse <uuid>
```

Confirms deduplication logic is working.

#### 5.9 Validation Error Verification

Counts errors in logs:
```bash
grep -c "out of range|Invalid UUID|future|positive"
```

Expected: ~10-15 validation errors from invalid message tests.

**Purpose**: Confirms consumer is actively rejecting bad data.

#### 5.10 MQTT Resilience Test

**Test Procedure:**
1. Restart MQTT broker (`docker restart`)
2. Wait 3 seconds
3. Check consumer logs for reconnection

**Expected Behavior:**
- Consumer detects disconnection
- Automatically reconnects within 30 seconds
- Logs show "MQTT connected" or "Reconnecting"

**Purpose**: Validates automatic reconnection logic.

#### 5.11 Final Health Check

**Test Procedure:**
1. Publish one more valid test message
2. Wait 2 seconds
3. Check logs for "Stored telemetry"

**Purpose**: Confirms consumer is still operational after all tests.

### 6. Logging & Cleanup

#### Success Path
- Shows running containers
- Displays last 100 lines of consumer logs

#### Failure Path
- Dumps last 200 lines of API logs
- Dumps last 200 lines of consumer logs
- Dumps last 100 lines of Postgres logs
- Dumps last 100 lines of MQTT logs

#### Cleanup
Always runs (`if: always()`):
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Removes containers and volumes to ensure clean state for next run.

## Test Coverage Summary

| Component | Test Type | Count | Pass Criteria |
|-----------|-----------|-------|---------------|
| Consumer | Unit (Rust) | 30 | All pass |
| Consumer | Integration (Bash) | 21 | Validation working |
| Database | Schema | 7 tables | All exist |
| Database | Seed data | 6 tables | Exact row counts |
| API | Health check | 1 | 200 OK |
| MQTT | Pub/sub | 1 | Message received |
| Consumer | MQTT connection | 1 | Connected |
| Consumer | Reconnection | 1 | Auto-reconnect |
| Consumer | Deduplication | 1 | Duplicates ignored |
| Consumer | Validation | ~14 | Invalid rejected |

**Total**: 70+ automated checks

## Running Tests Locally

### Full CI Simulation
```bash
# Use exact same commands as CI
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --parallel
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres mosquitto api consumer

# Wait for services
sleep 10

# Run unit tests
cd consumer
cargo test --lib

# Run integration tests
./test_consumer_ci.sh

# Cleanup
cd ..
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

### Quick Consumer Test
```bash
# Just consumer tests (assumes services running)
cd consumer
cargo test --lib
./test_consumer_ci.sh
```

### Individual Components
```bash
# Unit tests only
cargo test --lib

# Integration tests only
./test_consumer_ci.sh

# Extensive edge cases (slower, more verbose)
./test_consumer_edge_cases.sh
```

## Debugging CI Failures

### Database Issues
```bash
# Check if tables exist
docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c "\dt"

# Check row counts
docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c "SELECT count(*) FROM telemetry"

# Verify seed data ran
docker logs gardenaway-postgres | grep "seed"
```

### Consumer Issues
```bash
# Check consumer logs
docker logs gardenaway-consumer

# Check MQTT connection
docker logs gardenaway-consumer | grep "MQTT"

# Check validation errors
docker logs gardenaway-consumer | grep "out of range"
```

### MQTT Issues
```bash
# Test MQTT directly
mosquitto_pub -h localhost -t test -m "hello"
docker exec gardenaway-mosquitto mosquitto_sub -t test -C 1

# Check broker logs
docker logs gardenaway-mosquitto
```

### Integration Test Issues
```bash
# Run with verbose output locally
cd consumer
bash -x ./test_consumer_ci.sh

# Check if mosquitto_pub is installed
which mosquitto_pub

# Verify greenhouse exists
docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c "SELECT id FROM greenhouse"
```

## Environment Variables

CI uses these from docker-compose.dev.yml:

```yaml
API:
  ENVIRONMENT: development
  LOG_LEVEL: DEBUG
  DB_NAME: greenhouse_test

CONSUMER:
  RUST_LOG: debug
  DB_NAME: greenhouse_test
```

Plus standard variables from `.env`:
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `DB_HOST=postgres`
- `MQTT_HOST=mosquitto`

## Maintenance

### Adding New Tests

**Unit tests** (Rust):
1. Add to `consumer/src/models.rs` under `#[cfg(test)]`
2. Run locally: `cargo test --lib`
3. Update count in this doc

**Integration tests** (Bash):
1. Add to `consumer/test_consumer_ci.sh`
2. Update `TOTAL_TESTS`, `VALID_TESTS`, or `INVALID_TESTS`
3. Run locally: `./test_consumer_ci.sh`
4. Update expected counts in CI validation step if needed

### Updating Expected Database Rows

If seed data changes:
1. Update counts in `.github/workflows/ci.yml` step "Strict seed validation"
2. Update counts in `.github/workflows/ci.yml` step "Verify database changes"

### Updating Validation Rules

If consumer validation changes:
1. Update unit tests in `consumer/src/models.rs`
2. Update integration tests in `consumer/test_consumer_ci.sh`
3. Update expected error counts in CI
4. Update `consumer/TESTING.md`

## Performance

Typical CI run time:
- Setup & Build: ~2-3 minutes
- Database validation: ~30 seconds
- Consumer unit tests: ~5 seconds
- Integration tests: ~30 seconds
- Total: **~4-5 minutes**

## Security Considerations

- Uses test database only (`greenhouse_test`)
- Never touches production database (`greenhouse`)
- All containers are ephemeral (destroyed after tests)
- No credentials stored in code (uses `.env.example`)
- Test UUIDs are from seed data (not real devices)

## Future Enhancements

- [ ] Add performance/load testing
- [ ] Add code coverage reporting
- [ ] Add mutation testing
- [ ] Add fuzz testing for message parsing
- [ ] Add ESP32 firmware tests (if hardware-in-loop available)
- [ ] Add frontend E2E tests
- [ ] Add API integration tests
- [ ] Deploy to staging environment after passing tests
- [ ] Generate test reports (JUnit XML)
- [ ] Send notifications on failure (Slack, email)
