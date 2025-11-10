import express from "express";
import { dbService } from "../services/dbService.js";

const router = express.Router();

// GET /settings
router.get("/", async (req, res) => {
  try {
    const settings = await dbService.getSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// POST /settings
router.post("/", async (req, res) => {
  try {
    const newSettings = req.body;
    if (!newSettings) return res.status(400).json({ error: "No settings provided" });

    const allSettings = await dbService.getAll("appSettings");
    let savedSettings;

    if (allSettings.length > 0) {
      savedSettings = await dbService.update("appSettings", allSettings[0].id || allSettings[0]._id, newSettings);
    } else {
      savedSettings = await dbService.insert("appSettings", newSettings);
    }

    res.json(savedSettings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;