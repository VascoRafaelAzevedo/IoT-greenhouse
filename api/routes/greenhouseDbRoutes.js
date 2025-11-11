import express from 'express';
import { query, getClient } from '../services/postgresDbService.js';
import { authenticateToken } from './authMiddleware.js';
const router = express.Router();
const ONLINE_THRESHOLD_MINUTES = 10;
// Create greenhouse (copy plant parameters into setpoint)
router.post("/", authenticateToken,async (req, res) => {
  const { name, plant, owner_id } = req.body;

  if (!name || !plant || !owner_id) {
    return res.status(400).json({
      error: "Missing required fields: name, plant, owner_id"
    });
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    // Find plant by name
    const plantQuery = `SELECT * FROM plants WHERE plant_name = $1;`;
    const { rows: plantRows } = await client.query(plantQuery, [plant]);

    if (plantRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: `Plant '${plant}' not found` });
    }

    const p = plantRows[0];

    // Create greenhouse
    const insertGreenhouse = `
      INSERT INTO greenhouse (owner_id, name)
      VALUES ($1, $2)
      RETURNING id, name, created_at;
    `;
    const { rows: ghRows } = await client.query(insertGreenhouse, [owner_id, name]);
    const greenhouse = ghRows[0];

    // Create corresponding setpoint from plant template
    const insertSetpoint = `
      INSERT INTO setpoint (
        greenhouse_id,
        target_temp_min,
        target_temp_max,
        target_hum_air_max,
        irrigation_interval_minutes,
        irrigation_duration_seconds,
        target_light_intensity,
        plant
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const { rows: spRows } = await client.query(insertSetpoint, [
      greenhouse.id,
      p.target_temp_min,
      p.target_temp_max,
      p.target_hum_air_max,
      p.irrigation_interval_minutes,
      p.irrigation_duration_seconds,
      p.target_light_intensity,
      p.plant_name
    ]);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Greenhouse created successfully",
      greenhouse: {
        id: greenhouse.id,
        name: greenhouse.name,
        owner_id,
        created_at: greenhouse.created_at
      },
      setpoint: spRows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating greenhouse:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// Get all greenhouses of a user
router.get("/", authenticateToken,async (req, res) => {
  try {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.last_seen,
        s.plant_name AS plant,
        t.temp_air AS temperature,
        t.hum_air AS humidity,
        t.water_level_ok AS "waterLevel",
        t.light_intensity AS lighting,
        t.last_time
      FROM greenhouse g
      LEFT JOIN setpoint s ON s.greenhouse_id = g.id
      LEFT JOIN (
        SELECT DISTINCT ON (greenhouse_id)
          greenhouse_id,
          temp_air,
          hum_air,
          lux,
          light_intensity,
          water_level_ok,
          time AS last_time
        FROM telemetry
        ORDER BY greenhouse_id, time DESC
      ) t ON g.id = t.greenhouse_id
      ORDER BY g.created_at DESC;
    `;
    const client = await getClient();
    const { rows } = await client.query(query);
    const now = new Date();

    const result = rows.map(r => ({
      id: r.id,
      name: r.name,
      plant: r.plant || null,
      temperature: r.temperature,
      humidity: r.humidity,
      waterLevel: r.waterLevel,
      lighting: r.lighting,
      isOnline:
        r.last_time &&
        (now - new Date(r.last_time)) / 60000 < ONLINE_THRESHOLD_MINUTES
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching greenhouses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//Get single greenhouse + last telemetry + setpoint + last connection
router.get("/:id", authenticateToken,async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        g.id,
        g.name,
        g.last_seen,
        s.plant_name AS plant,
        s.target_temp_min,
        s.target_temp_max,
        s.target_hum_air_max,
        s.irrigation_interval_minutes,
        s.irrigation_duration_seconds,
        s.target_light_intensity,
        t.temp_air AS temperature,
        t.hum_air AS humidity,
        t.water_level_ok AS waterLevel,
        t.light_intensity AS lighting,
        t.time AS last_time
      FROM greenhouse g
      LEFT JOIN setpoint s ON s.greenhouse_id = g.id
      LEFT JOIN LATERAL (
        SELECT 
          temp_air,
          hum_air,
          lux,
          light_intensity,
          water_level_ok,
          time
        FROM telemetry
        WHERE telemetry.greenhouse_id = g.id
        ORDER BY time DESC
        LIMIT 1
      ) t ON TRUE
      WHERE g.id = $1;
    `;
    const client = await getClient();
    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Greenhouse not found" });
    }

    const r = rows[0];
    const now = new Date();
    const isOnline =
      r.last_time &&
      (now - new Date(r.last_time)) / 60000 < ONLINE_THRESHOLD_MINUTES;

    const result = {
      id: r.id,
      name: r.name,
      plant: r.plant,
      isOnline,
      temperature: r.temperature,
      humidity: r.humidity,
      waterLevel: r.waterLevel,
      lighting: r.lighting,
      lastTelemetryAt: r.last_time,
      setpoint: {
        target_temp_min: r.target_temp_min,
        target_temp_max: r.target_temp_max,
        target_hum_air_max: r.target_hum_air_max,
        irrigation_interval_minutes: r.irrigation_interval_minutes,
        irrigation_duration_seconds: r.irrigation_duration_seconds,
        target_light_intensity: r.target_light_intensity
      }
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching greenhouse by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PARAM_MAP = {
  temperature: "temp_air",
  humidity: "hum_air",
  lighting: "light_intensity",
  lux: "lux",
  waterLevel: "water_level_ok",
  lightOn: "light_on",
  pumpOn: "pump_on"
};

//Get last 30 telemetry points
router.get("/:id/history", authenticateToken,async (req, res) => {
  const { id } = req.params;
  const { parameter } = req.query;

  try {
    // Validate parameter
    const column = PARAM_MAP[parameter];
    if (!column) {
      return res.status(400).json({
        error: `Invalid parameter. Allowed: ${Object.keys(PARAM_MAP).join(", ")}`
      });
    }

    const query = `
      SELECT time, ${column} AS value
      FROM telemetry
      WHERE greenhouse_id = $1
      ORDER BY time DESC
      LIMIT 30;
    `;
    const client = await getClient();
    const { rows } = await client.query(query, [id]);

    // Reverse to chronological order (oldest first)
    const result = rows.reverse().map(r => ({
      time: r.time,
      value: r.value
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching telemetry history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Update setpoint values
router.patch("/:id/setpoint",authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Allowed columns to update
  const allowedFields = [
    "target_temp_min",
    "target_temp_max",
    "target_hum_air_max",
    "irrigation_interval_minutes",
    "irrigation_duration_seconds",
    "target_light_intensity",
    "plant"
  ];

  // Filter only valid fields from body
  const fields = Object.keys(updates).filter(f => allowedFields.includes(f));

  if (fields.length === 0) {
    return res.status(400).json({
      error: `No valid fields to update. Allowed: ${allowedFields.join(", ")}`
    });
  }

  try {
    // Dynamically build the SET clause
    const setClauses = fields.map(
      (field, idx) => `${field} = $${idx + 2}` // +2 because $1 is the greenhouse_id
    );
    const values = fields.map(f => updates[f]);

    const query = `
      UPDATE setpoint
      SET ${setClauses.join(", ")}, changed_at = NOW()
      WHERE greenhouse_id = $1
      RETURNING *;
    `;
    const client = await getClient();
    const { rows } = await client.query(query, [id, ...values]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Setpoint not found for this greenhouse" });
    }

    res.json({
      message: "Setpoint updated successfully",
      greenhouse_id: id,
      updatedFields: fields,
      updatedValues: rows[0]
    });
  } catch (error) {
    console.error("Error updating setpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete greenhouse (cascade removes setpoint, telemetry, etc.)
router.delete("/:id", authenticateToken,async (req, res) => {
  const { id } = req.params;

  try {
    const query = `DELETE FROM greenhouse WHERE id = $1 RETURNING id, name;`;
    const client =await getClient();
    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Greenhouse not found" });
    }

    res.json({
      message: "Greenhouse and related data deleted successfully",
      deleted: rows[0]
    });
  } catch (error) {
    console.error("Error deleting greenhouse:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
