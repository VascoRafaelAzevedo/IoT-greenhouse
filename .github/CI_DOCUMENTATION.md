# CI/CD Pipeline

## Triggers
- Push to any branch
- Pull requests to `main`

## Test Stages

### 1. Environment Setup
- Docker + PostgreSQL + MQTT broker
- Uses `greenhouse_test` database with seed data
- Captures initial row counts for integrity checks

### 2. Rust Unit Tests (30 tests)
```bash
docker exec gardenaway-consumer-ci cargo test --lib
```

Validates parsing/validation logic for all message fields.

### 3. Integration Tests (21 tests)
```bash
cd consumer && ./test_consumer_ci.sh
```

End-to-end MQTT testing:
- Valid/invalid messages
- Boundary values
- Type safety
- Duplicate detection
- MQTT resilience

### 4. Database Verification
Ensures no invalid data inserted. Checks row counts in:
- `telemetry`
- `greenhouse`
- `plant`
- `setpoint`
- `connection`

## Validation Rules

| Field | Type | Range | Required |
|-------|------|-------|----------|
| device_id | UUID v4 | - | Yes |
| timestamp | Unix ts | Past only (60s skew) | Yes |
| sequence | i64 | >0 | Yes |
| temperature | f64 | -50.0 to 100.0 | Yes |
| humidity | f64 | 0.0 to 100.0 | Yes |
| light | f64 | 0.0 to 100000.0 | Yes |
| light_intensity | f64 | 0.0 to 100.0 | No |
| tank_level | bool | - | Yes |
| lights_are_on | bool | - | Yes |
| irrigated_since_last_transmission | bool | - | No (default: false) |
| pump_on | bool | - | No (default: false) |

**Deduplication:** Primary key `(greenhouse_id, time, sequence)`. Duplicates logged at INFO, not inserted.

## Local Testing

```bash
# Full CI simulation
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
docker exec gardenaway-consumer cargo test --lib
cd consumer && ./test_consumer_ci.sh

# Unit tests only
cd consumer && cargo test --lib

# Watch mode
cd consumer && cargo watch -x 'test --lib'
```

## Performance

Average run time: ~2-3 minutes
- Build: ~30s
- Unit tests: ~5s
- Integration: ~60s
- DB verification: ~5s

