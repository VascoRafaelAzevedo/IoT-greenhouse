# Consumer Testing

## Unit Tests (30 tests)

```bash
cargo test --lib
```

**Coverage:**
- UUID v4 validation, timestamp (no future/zero/negative), sequence (positive only)
- Temperature: -50.0 to 100.0, Humidity: 0.0 to 100.0, Light: 0.0 to 100000.0
- Type safety, missing fields, malformed JSON

## Integration Tests

**CI-optimized (21 tests):**
```bash
./test_consumer_ci.sh
```

**Full edge cases (35+ tests):**
```bash
./test_consumer_edge_cases.sh
```

## Validation Rules

| Field | Range | Notes |
|-------|-------|-------|
| temperature | -50.0 to 100.0 | °C |
| humidity | 0.0 to 100.0 | % |
| light | 0.0 to 100000.0 | lux |
| light_intensity | 0.0 to 100.0 | % (optional) |
| timestamp | past only | allows 60s clock skew |
| sequence | >0 | milliseconds since boot |
| device_id | UUID v4 | normalized lowercase |

## Deduplication

Primary key: `(greenhouse_id, time, sequence)`

Duplicates are checked before insert. If found, logged at INFO level and skipped silently.

## Error Messages

**Parsing (serde):**
- `"UUID must be version 4"`
- `"Timestamp must be positive"`
- `"Timestamp cannot be in the future"`
- `"Sequence must be positive"`

**Validation:**
- `"Temperature out of range: X (expected: -50.0 to 100.0)"`
- `"Humidity out of range: X (expected: 0.0 to 100.0)"`
- `"Light value out of range: X (expected: 0.0 to 100000.0)"`

