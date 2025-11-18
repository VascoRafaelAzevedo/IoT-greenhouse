// plantsRoutes.js
import express from 'express';
import { query } from './postgresDbService.js';

const router = express.Router();

// Get all plants
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM plants ORDER BY plant_name ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get plants' });
  }
});

// Get single plant by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await query('SELECT * FROM plants WHERE plant_id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Plant not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get plant' });
  }
});

export default router;
