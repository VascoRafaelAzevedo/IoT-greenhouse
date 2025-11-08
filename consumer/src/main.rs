mod config;
mod models;
mod db;

use anyhow::{Result, Context};
use log::{info, warn, error};
use rumqttc::{AsyncClient, MqttOptions, QoS, Event, Packet};
use std::time::Duration;

use config::Config;
use models::TelemetryMessage;
use db::Database;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .init();
    
    info!("GardenAway MQTT Consumer starting");
    
    // Load configuration
    let config = Config::from_env()
        .context("Failed to load configuration")?;
    
    info!("Configuration loaded");
    info!("  MQTT: {}:{}", config.mqtt_host, config.mqtt_port);
    info!("  Topic: {}", config.mqtt_telemetry_topic);
    info!("  Database: {}@{}/{}", config.db_user, config.db_host, config.db_name);
    
    // Connect to database
    let db = Database::connect(&config).await
        .context("Failed to connect to database")?;
    
    // Set up MQTT options
    let mut mqttoptions = MqttOptions::new("gardenaway-consumer", &config.mqtt_host, config.mqtt_port);
    mqttoptions.set_keep_alive(Duration::from_secs(30));
    mqttoptions.set_clean_session(true);
    
    info!("Connecting to MQTT broker: {}:{}", config.mqtt_host, config.mqtt_port);
    
    // Create MQTT client
    let (client, mut eventloop) = AsyncClient::new(mqttoptions, 10);
    
    // Subscribe to telemetry topic
    info!("Subscribing to topic: {}", config.mqtt_telemetry_topic);
    client.subscribe(&config.mqtt_telemetry_topic, QoS::AtLeastOnce).await?;
    
    info!("Consumer ready - waiting for messages");
    
    // Event loop - process incoming messages
    loop {
        match eventloop.poll().await {
            Ok(event) => {
                // Log MQTT connection event
                if let Event::Incoming(Packet::ConnAck(_)) = event {
                    info!("MQTT connected");
                }
                
                if let Event::Incoming(Packet::Publish(publish)) = event {
                    let topic = &publish.topic;
                    let payload = &publish.payload;
                    
                    // Parse JSON payload
                    match serde_json::from_slice::<TelemetryMessage>(payload) {
                        Ok(telemetry) => {
                            info!("Received telemetry from: {}", telemetry.greenhouse_id);
                            info!("  Topic: {}", topic);
                            info!("  Seq: {}, Temp: {}°C, Humidity: {}%, Light: {} lux",
                                  telemetry.sequence, telemetry.temperature, telemetry.humidity, telemetry.light);
                            info!("  Tank: {}, Pump: {}, Lights: {}",
                                  telemetry.tank_level, telemetry.pump_on, telemetry.lights_are_on);
                            
                            // Validate message
                            if let Err(e) = telemetry.validate() {
                                error!("Invalid telemetry message: {}", e);
                                continue;
                            }
                            
                            // Check if greenhouse exists
                            match db.greenhouse_exists(&telemetry.greenhouse_id).await {
                                Ok(true) => {
                                    // Insert into database
                                    match db.insert_telemetry(&telemetry).await {
                                        Ok(()) => {
                                            // Update last_seen timestamp
                                            if let Err(e) = db.update_greenhouse_last_seen(&telemetry.greenhouse_id, &telemetry.timestamp).await {
                                                warn!("Failed to update last_seen: {}", e);
                                            }
                                        },
                                        Err(e) => {
                                            error!("Database insert failed: {}", e);
                                        }
                                    }
                                },
                                Ok(false) => {
                                    warn!("Greenhouse {} not found in database - skipping", telemetry.greenhouse_id);
                                },
                                Err(e) => {
                                    error!("Database query failed: {}", e);
                                }
                            }
                        },
                        Err(e) => {
                            error!("Failed to parse JSON: {}", e);
                            error!("  Payload: {}", String::from_utf8_lossy(payload));
                        }
                    }
                }
            },
            Err(e) => {
                error!("MQTT error: {}", e);
                warn!("Reconnecting in 5 seconds");
                tokio::time::sleep(Duration::from_secs(5)).await;
            }
        }
    }
}


