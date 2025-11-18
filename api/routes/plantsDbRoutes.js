import express from 'express';
import { query,getClient } from '../services/postgresDbService.js';
import { authenticateToken } from './authMiddleware.js';
const router = express.Router();

// Get all plants
router.get("/", authenticateToken,async (req, res) => {
  try {
    const query = `
      SELECT 
        plant_id,
        plant_name,
        plant_descripion,
        target_temp_min,
        target_temp_max,
        target_hum_air_max,
        irrigation_interval_minutes,
        irrigation_duration_seconds,
        target_light_intensity
      FROM plants
      ORDER BY plant_name ASC;
    `;
    const client = await getClient();
    const { rows } = await client.query(query);

    const result = rows.map(p => {
      const temperature =
        p.target_temp_min != null && p.target_temp_max != null
          ? { min: p.target_temp_min, max: p.target_temp_max }
          : p.target_temp_max ?? p.target_temp_min ?? null;

      const humidity =
        p.target_hum_air_max != null
          ? p.target_hum_air_max
          : null;

      return {
        id: p.plant_id,
        name: p.plant_name,
        description: p.plant_descripion,
        optimalTemperature: temperature,
        optimalHumidity: humidity,
        irrigationInterval: p.irrigation_interval_minutes,
        irrigationDurationSec: p.irrigation_duration_seconds,
        optimalLighting: p.target_light_intensity
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching plants:", error);
    res.status(500).json({ error: error.message });
  }
});


// Get single plant by ID
router.get("/:id", authenticateToken,async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        plant_id,
        plant_name,
        plant_descripion,
        target_temp_min,
        target_temp_max,
        target_hum_air_max,
        irrigation_interval_minutes,
        irrigation_duration_seconds,
        target_light_intensity
      FROM plants
      WHERE plant_id = $1;
    `;
    const client = await getClient();
    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Plant not found" });
    }

    const p = rows[0];

    const temperature =
      p.target_temp_min != null && p.target_temp_max != null
        ? { min: p.target_temp_min, max: p.target_temp_max }
        : p.target_temp_max ?? p.target_temp_min ?? null;

    const humidity =
      p.target_hum_air_max != null
        ? p.target_hum_air_max
        : null;

    const result = {
      id: p.plant_id,
      name: p.plant_name,
      description: p.plant_descripion,
      optimalTemperature: temperature,
      optimalHumidity: humidity,
      irrigationInterval: p.irrigation_interval_minutes,
      irrigationDurationSec: p.irrigation_duration_seconds,
      optimalLighting: p.target_light_intensity
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching plant:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
