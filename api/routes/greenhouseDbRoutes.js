// greenhouseRoutes.js
import express from 'express';
import { query, getClient } from './postgresDbService.js';

const router = express.Router();

// 📦 Create greenhouse (copy plant parameters into setpoint)
router.post('/', async (req, res) => {
  const { owner_id, plant_id, name } = req.body;

  if (!owner_id || !plant_id || !name) {
    return res.status(400).json({ error: 'Missing owner_id, plant_id or name' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Create greenhouse
    const ghRes = await client.query(
      `INSERT INTO greenhouse (owner_id, name)
       VALUES ($1, $2)
       RETURNING id, owner_id, name, created_at`,
      [owner_id, name]
    );
    const greenhouse = ghRes.rows[0];

    // Copy plant parameters into setpoint
    await client.query(
      `INSERT INTO setpoint (greenhouse_id, target_temp_min, target_temp_max, target_hum_air_min,
        target_hum_air_max, irrigation_interval_minutes, irrigation_duration_seconds, target_light_intensity)
       SELECT $1, p.target_temp_min, p.target_temp_max, p.target_hum_air_min, p.target_hum_air_max,
              p.irrigation_interval_minutes, p.irrigation_duration_seconds, p.target_light_intensity
       FROM plants p WHERE p.plant_it = $2`,
      [greenhouse.id, plant_id]
    );

    await client.query('COMMIT');
    res.status(201).json(greenhouse);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating greenhouse:', err);
    res.status(500).json({ error: 'Failed to create greenhouse' });
  } finally {
    client.release();
  }
});

// 🌱 Get all greenhouses of a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { rows } = await query(
      'SELECT * FROM greenhouse WHERE owner_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get greenhouses' });
  }
});

// 🌿 Get single greenhouse + last telemetry + setpoint + last connection
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const ghRes = await query('SELECT * FROM greenhouse WHERE id = $1', [id]);
    if (ghRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });

    const setpoint = (await query('SELECT * FROM setpoint WHERE greenhouse_id = $1', [id])).rows[0];
    const lastTelemetry = (
      await query(
        'SELECT * FROM telemetry WHERE greenhouse_id = $1 ORDER BY time DESC LIMIT 1',
        [id]
      )
    ).rows[0];
    const lastEvent = (
      await query(
        'SELECT * FROM connection_event WHERE greenhouse_id = $1 ORDER BY end_ts DESC LIMIT 1',
        [id]
      )
    ).rows[0];

    res.json({
      greenhouse: ghRes.rows[0],
      setpoint,
      lastTelemetry,
      lastEvent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get greenhouse' });
  }
});

// 🌤 Get last 30 telemetry points
router.get('/:id/telemetry', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await query(
      'SELECT * FROM telemetry WHERE greenhouse_id = $1 ORDER BY time DESC LIMIT 30',
      [id]
    );
    res.json(rows.reverse()); // reverse to get oldest→newest for graph
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get telemetry history' });
  }
});

// 🧭 Update setpoint values
router.patch('/:id/setpoint', async (req, res) => {
  const { id } = req.params;
  const fields = [
    'target_temp_min',
    'target_temp_max',
    'target_hum_air_min',
    'target_hum_air_max',
    'irrigation_interval_minutes',
    'irrigation_duration_seconds',
    'target_light_intensity',
  ];

  const updates = [];
  const values = [];
  let idx = 1;
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${idx++}`);
      values.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(id);
  const queryText = `
    UPDATE setpoint
    SET ${updates.join(', ')}, changed_at = now()
    WHERE greenhouse_id = $${values.length}
    RETURNING *;
  `;

  try {
    const { rows } = await query(queryText, values);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update setpoint' });
  }
});

// 🗑 Delete greenhouse (cascade removes setpoint, telemetry, etc.)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM greenhouse WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete greenhouse' });
  }
});

export default router;
