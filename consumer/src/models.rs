use chrono::{DateTime, Utc, TimeZone};
use serde::{Deserialize, Deserializer, Serialize};
use uuid::Uuid;

/// Telemetry message structure matching ESP32 JSON payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryMessage {
    /// Device ID (greenhouse UUID) - must be valid UUID v4
    #[serde(rename = "device_id", deserialize_with = "deserialize_uuid_v4")]
    pub greenhouse_id: Uuid,
    
    /// Timestamp from ESP32 (Unix timestamp in seconds)
    /// Must be in the past (buffered data from ESP32)
    #[serde(deserialize_with = "deserialize_timestamp")]
    pub timestamp: DateTime<Utc>,
    
    /// Sequence number for ordering messages with same timestamp
    /// Must be positive (non-zero)
    #[serde(deserialize_with = "deserialize_sequence")]
    pub sequence: i64,
    
    /// Temperature in Celsius (-50.0 to 100.0)
    pub temperature: f64,
    
    /// Air humidity percentage (0.0 to 100.0)
    pub humidity: f64,
    
    /// Light intensity in lux (0.0 to 100000.0)
    pub light: f64,
    
    /// Optional light intensity percentage (0.0 to 100.0)
    #[serde(default)]
    pub light_intensity: Option<f64>,
    
    /// Tank water level OK status
    pub tank_level: bool,
    
    /// Was irrigation performed since last transmission
    #[serde(default)]
    pub irrigated_since_last_transmission: bool,
    
    /// Are LED lights currently on
    pub lights_are_on: bool,
    
    /// Is water pump currently on (defaults to false if missing)
    #[serde(default)]
    pub pump_on: bool,
}

/// Deserialize and validate UUID v4
fn deserialize_uuid_v4<'de, D>(deserializer: D) -> Result<Uuid, D::Error>
where
    D: Deserializer<'de>,
{
    let uuid_str = String::deserialize(deserializer)?;
    let uuid = Uuid::parse_str(&uuid_str)
        .map_err(serde::de::Error::custom)?;
    
    // Verify it's UUID v4
    if uuid.get_version_num() != 4 {
        return Err(serde::de::Error::custom(format!(
            "UUID must be version 4, got version {}",
            uuid.get_version_num()
        )));
    }
    
    Ok(uuid)
}

/// Deserialize and validate timestamp (must be in the past, not zero, not negative)
fn deserialize_timestamp<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
where
    D: Deserializer<'de>,
{
    let timestamp = i64::deserialize(deserializer)?;
    
    // Reject zero or negative timestamps
    if timestamp <= 0 {
        return Err(serde::de::Error::custom(format!(
            "Timestamp must be positive, got {}",
            timestamp
        )));
    }
    
    // Convert to DateTime
    let dt = Utc.timestamp_opt(timestamp, 0)
        .single()
        .ok_or_else(|| serde::de::Error::custom("Invalid timestamp"))?;
    
    // Reject future timestamps (allow small clock skew of 60 seconds)
    let now = Utc::now();
    let max_allowed = now + chrono::Duration::seconds(60);
    
    if dt > max_allowed {
        return Err(serde::de::Error::custom(format!(
            "Timestamp is in the future: {} (now: {})",
            dt, now
        )));
    }
    
    Ok(dt)
}

/// Deserialize and validate sequence number (must be positive)
fn deserialize_sequence<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
    D: Deserializer<'de>,
{
    let seq = i64::deserialize(deserializer)?;
    
    if seq <= 0 {
        return Err(serde::de::Error::custom(format!(
            "Sequence number must be positive, got {}",
            seq
        )));
    }
    
    Ok(seq)
}

impl TelemetryMessage {
    /// Validate that the message has required fields and values in range
    pub fn validate(&self) -> Result<(), String> {
        // Temperature validation (-50°C to 100°C)
        if self.temperature < -50.0 || self.temperature > 100.0 {
            return Err(format!(
                "Temperature out of range: {} (valid: -50.0 to 100.0)",
                self.temperature
            ));
        }
        
        // Humidity validation (0% to 100%, no negatives)
        if self.humidity < 0.0 || self.humidity > 100.0 {
            return Err(format!(
                "Humidity out of range: {} (valid: 0.0 to 100.0)",
                self.humidity
            ));
        }
        
        // Light validation (0 to 100000 lux)
        if self.light < 0.0 || self.light > 100000.0 {
            return Err(format!(
                "Light value out of range: {} (valid: 0.0 to 100000.0)",
                self.light
            ));
        }
        
        // Light intensity validation (0% to 100%, optional)
        if let Some(intensity) = self.light_intensity {
            if intensity < 0.0 || intensity > 100.0 {
                return Err(format!(
                    "Light intensity out of range: {} (valid: 0.0 to 100.0)",
                    intensity
                ));
            }
        }
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    // ========== Valid Message Tests ==========
    
    #[test]
    fn test_valid_telemetry_message() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1699459200000,
            "temperature": 22.5,
            "humidity": 65.0,
            "light": 350.0,
            "light_intensity": 75.0,
            "tank_level": true,
            "irrigated_since_last_transmission": false,
            "lights_are_on": true,
            "pump_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert_eq!(msg.temperature, 22.5);
        assert_eq!(msg.humidity, 65.0);
        assert_eq!(msg.light, 350.0);
        assert_eq!(msg.sequence, 1699459200000);
        assert!(msg.validate().is_ok());
    }
    
    #[test]
    fn test_optional_fields_missing() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 22.5,
            "humidity": 65.0,
            "light": 350.0,
            "tank_level": true,
            "lights_are_on": true
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert_eq!(msg.light_intensity, None);
        assert_eq!(msg.irrigated_since_last_transmission, false);
        assert_eq!(msg.pump_on, false);
    }
    
    // ========== Temperature Validation Tests ==========
    
    #[test]
    fn test_temperature_at_lower_limit() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": -50.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_ok());
    }
    
    #[test]
    fn test_temperature_at_upper_limit() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 100.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_ok());
    }
    
    #[test]
    fn test_temperature_below_limit() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": -50.1,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_err());
        assert!(msg.validate().unwrap_err().contains("Temperature out of range"));
    }
    
    #[test]
    fn test_temperature_above_limit() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 100.1,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_err());
    }
    
    #[test]
    fn test_temperature_extreme_values() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 999999.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_err());
    }
    
    // ========== Humidity Validation Tests ==========
    
    #[test]
    fn test_humidity_at_limits() {
        let json_0 = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 0.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json_0).unwrap();
        assert!(msg.validate().is_ok());
        
        let json_100 = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 100.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json_100).unwrap();
        assert!(msg.validate().is_ok());
    }
    
    #[test]
    fn test_humidity_negative() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": -0.1,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_err());
        assert!(msg.validate().unwrap_err().contains("Humidity out of range"));
    }
    
    #[test]
    fn test_humidity_above_100() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 100.1,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_err());
    }
    
    // ========== Light Validation Tests ==========
    
    #[test]
    fn test_light_at_limits() {
        let json_0 = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 0.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json_0).unwrap();
        assert!(msg.validate().is_ok());
        
        let json_max = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100000.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json_max).unwrap();
        assert!(msg.validate().is_ok());
    }
    
    #[test]
    fn test_light_negative() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": -1.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_err());
        assert!(msg.validate().unwrap_err().contains("Light value out of range"));
    }
    
    #[test]
    fn test_light_above_max() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100000.1,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_err());
    }
    
    // ========== Light Intensity Tests ==========
    
    #[test]
    fn test_light_intensity_valid() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "light_intensity": 50.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_ok());
    }
    
    #[test]
    fn test_light_intensity_out_of_range() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "light_intensity": 101.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_err());
    }
    
    // ========== Timestamp Validation Tests ==========
    
    #[test]
    fn test_timestamp_zero() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 0,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("positive"));
    }
    
    #[test]
    fn test_timestamp_negative() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": -1,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_timestamp_future() {
        // Timestamp far in the future (year 2100)
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 4102444800,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("future"));
    }
    
    // ========== Sequence Validation Tests ==========
    
    #[test]
    fn test_sequence_zero() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 0,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("positive"));
    }
    
    #[test]
    fn test_sequence_negative() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": -1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    // ========== UUID Validation Tests ==========
    
    #[test]
    fn test_uuid_not_v4() {
        // UUID v1 (time-based)
        let json = r#"{
            "device_id": "c232ab00-9414-11ec-b909-0242ac120002",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("version 4"));
    }
    
    #[test]
    fn test_uuid_invalid_format() {
        let json = r#"{
            "device_id": "not-a-uuid",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_uuid_nil() {
        let json = r#"{
            "device_id": "00000000-0000-0000-0000-000000000000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_uuid_uppercase() {
        // Should accept and normalize
        let json = r#"{
            "device_id": "550E8400-E29B-41D4-A716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert_eq!(msg.greenhouse_id.to_string(), "550e8400-e29b-41d4-a716-446655440000");
    }
    
    // ========== Type Validation Tests ==========
    
    #[test]
    fn test_temperature_as_string() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": "twenty two",
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_tank_level_as_number() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": 1,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    // ========== Missing Required Fields Tests ==========
    
    #[test]
    fn test_missing_temperature() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_missing_device_id() {
        let json = r#"{
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        }"#;
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    // ========== Malformed JSON Tests ==========
    
    #[test]
    fn test_malformed_json() {
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false
        "#; // Missing closing brace
        
        let result: Result<TelemetryMessage, _> = serde_json::from_str(json);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_extra_fields() {
        // Should ignore extra fields
        let json = r#"{
            "device_id": "550e8400-e29b-41d4-a716-446655440000",
            "timestamp": 1699459200,
            "sequence": 1,
            "temperature": 20.0,
            "humidity": 50.0,
            "light": 100.0,
            "tank_level": true,
            "lights_are_on": false,
            "extra_field": "should be ignored"
        }"#;
        
        let msg: TelemetryMessage = serde_json::from_str(json).unwrap();
        assert!(msg.validate().is_ok());
    }
}
