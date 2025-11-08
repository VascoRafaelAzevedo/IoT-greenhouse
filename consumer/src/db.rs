use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use log::{info, warn};
use tokio_postgres::{Client, NoTls};
use uuid::Uuid;

use crate::config::Config;
use crate::models::TelemetryMessage;

/// Database client wrapper
pub struct Database {
    client: Client,
}

impl Database {
    /// Connect to PostgreSQL database
    pub async fn connect(config: &Config) -> Result<Self> {
        let conn_string = config.db_connection_string();
        info!(
            "Connecting to database: {}/{}",
            config.db_host, config.db_name
        );

        let (client, connection) = tokio_postgres::connect(&conn_string, NoTls)
            .await
            .context("Failed to connect to database")?;

        // Spawn connection to run in background
        tokio::spawn(async move {
            if let Err(e) = connection.await {
                eprintln!("Database connection error: {}", e);
            }
        });

        info!("Database connected");
        Ok(Database { client })
    }

    /// Insert telemetry data into the database
    /// Returns Ok if inserted or if duplicate was safely ignored
    pub async fn insert_telemetry(&self, msg: &TelemetryMessage) -> Result<()> {
        // First check if this exact record already exists (deduplication)
        // Primary key is (greenhouse_id, time, sequence)
        let check_query = r#"
            SELECT EXISTS(
                SELECT 1 FROM telemetry 
                WHERE greenhouse_id = $1 
                  AND time = $2 
                  AND sequence = $3
            )
        "#;

        let exists: bool = self
            .client
            .query_one(
                check_query,
                &[&msg.greenhouse_id, &msg.timestamp, &msg.sequence],
            )
            .await
            .context("Failed to check for duplicate telemetry")?
            .get(0);

        if exists {
            info!(
                "Duplicate telemetry ignored: greenhouse={}, time={}, seq={}",
                msg.greenhouse_id, msg.timestamp, msg.sequence
            );
            return Ok(());
        }

        // Map ESP32 field names to database column names
        let query = r#"
            INSERT INTO telemetry (
                time,
                greenhouse_id,
                sequence,
                temp_air,
                hum_air,
                lux,
                light_intensity,
                light_on,
                water_level_ok,
                pump_on
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        "#;

        let result = self
            .client
            .execute(
                query,
                &[
                    &msg.timestamp,       // time
                    &msg.greenhouse_id,   // greenhouse_id
                    &msg.sequence,        // sequence
                    &msg.temperature,     // temp_air (mapped from 'temperature')
                    &msg.humidity,        // hum_air (mapped from 'humidity')
                    &msg.light,           // lux (mapped from 'light')
                    &msg.light_intensity, // light_intensity (optional)
                    &msg.lights_are_on,   // light_on (mapped from 'lights_are_on')
                    &msg.tank_level,      // water_level_ok (mapped from 'tank_level')
                    &msg.pump_on,         // pump_on
                ],
            )
            .await
            .context("Failed to insert telemetry")?;

        if result == 1 {
            info!(
                "Telemetry stored: greenhouse={}, seq={}",
                msg.greenhouse_id, msg.sequence
            );
        } else {
            warn!("Unexpected insert result count: {}", result);
        }

        Ok(())
    }

    /// Update greenhouse last_seen timestamp
    pub async fn update_greenhouse_last_seen(
        &self,
        greenhouse_id: &Uuid,
        timestamp: &DateTime<Utc>,
    ) -> Result<()> {
        let query = "UPDATE greenhouse SET last_seen = $1 WHERE id = $2";

        self.client
            .execute(query, &[timestamp, greenhouse_id])
            .await
            .context("Failed to update last_seen")?;

        Ok(())
    }

    /// Check if greenhouse exists in database
    pub async fn greenhouse_exists(&self, greenhouse_id: &Uuid) -> Result<bool> {
        let query = "SELECT EXISTS(SELECT 1 FROM greenhouse WHERE id = $1)";

        let row = self
            .client
            .query_one(query, &[greenhouse_id])
            .await
            .context("Failed to check greenhouse existence")?;

        Ok(row.get(0))
    }
}

#[cfg(test)]
mod tests {
    //use super::*;

    // Integration tests would go here
    // They would require a test database to be running
}
