import express from "express";
import { dbService } from "../services/dbService.js";

const router = express.Router();

/** GET all greenhouses */
router.get("/", async (req, res) => {
  const data = await dbService.getAll("greenhouses");
  res.json(data);
});

/** GET single greenhouse */
router.get("/:id", async (req, res) => {
  const g = await dbService.getOne("greenhouses", req.params.id);
  if (!g) return res.status(404).json({ error: "Not found" });
  res.json(g);
});

/** PATCH update greenhouse */
router.patch("/:id", async (req, res) => {
  try {
    const updated = await dbService.update("greenhouses", req.params.id, req.body);
    res.json(updated);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

/** GET history (simulated) */
router.get("/:id/history", (req, res) => {
  const { parameter } = req.query;
  const data = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const value = 20 + (Math.random() - 0.5) * 4;
    data.push({
      time: time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      value: Math.round(value * 10) / 10,
    });
  }

  res.json(data);
});
/** POST create new greenhouse */
router.post("/", async (req, res) => {
  try {
    const { name, plant, temperature, humidity, waterLevel, soilHumidity, lighting, isOnline } = req.body;

    if (!name || !plant) {
      return res.status(400).json({ error: "Missing required fields: name or plant" });
    }

    const newGreenhouse = await dbService.create("greenhouses", {
      name,
      plant,
      temperature: temperature || 20,
      humidity: humidity || 50,
      waterLevel: waterLevel || 80,
      soilHumidity: soilHumidity || 50,
      lighting: lighting || 70,
      isOnline: isOnline ?? true
    });

    res.status(201).json(newGreenhouse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
