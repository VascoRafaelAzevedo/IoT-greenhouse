use anyhow::Result;
use std::env;

/// Application configuration loaded from environment variables
#[derive(Debug, Clone)]
pub struct Config {
    // MQTT Configuration
    pub mqtt_host: String,
    pub mqtt_port: u16,
    pub mqtt_telemetry_topic: String,
    
    // Database Configuration
    pub db_host: String,
    pub db_port: u16,
    pub db_user: String,
    pub db_password: String,
    pub db_name: String,
}

impl Config {
    /// Load configuration from environment variables
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok(); // Load .env file if it exists
        
        Ok(Config {
            // MQTT settings
            mqtt_host: env::var("MQTT_HOST")
                .unwrap_or_else(|_| "localhost".to_string()),
            mqtt_port: env::var("MQTT_PORT")
                .unwrap_or_else(|_| "1883".to_string())
                .parse()?,
            mqtt_telemetry_topic: env::var("MQTT_TELEMETRY_TOPIC")
                .unwrap_or_else(|_| "greenhouse/+/telemetry".to_string()),
            
            // Database settings
            db_host: env::var("DB_HOST")
                .unwrap_or_else(|_| "localhost".to_string()),
            db_port: env::var("DB_PORT")
                .unwrap_or_else(|_| "5432".to_string())
                .parse()?,
            db_user: env::var("DB_USER")
                .unwrap_or_else(|_| "postgres".to_string()),
            db_password: env::var("DB_PASSWORD")
                .expect("DB_PASSWORD must be set"),
            db_name: env::var("DB_NAME")
                .unwrap_or_else(|_| "greenhouse".to_string()),
        })
    }
    
    /// Build PostgreSQL connection string
    pub fn db_connection_string(&self) -> String {
        format!(
            "host={} port={} user={} password={} dbname={}",
            self.db_host, self.db_port, self.db_user, self.db_password, self.db_name
        )
    }
}
