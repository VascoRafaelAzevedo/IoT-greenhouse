import express from "express";
import { dbService } from "../services/dbService.js";

const router = express.Router();

/** GET all plants */
router.get("/", async (req, res) => {
  const data = await dbService.getAll("plants");
  res.json(data);
});

/** GET one plant */
router.get("/:id", async (req, res) => {
  const p = await dbService.getOne("plants", req.params.id);
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

export default router;
