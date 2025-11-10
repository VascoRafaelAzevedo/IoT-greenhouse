import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dbService } from "./services/dbService.js";
import greenhouseRoutes from "./routes/greenhouseRoutes.js";
import plantRoutes from "./routes/plantRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

await dbService.connect();

// Routes
app.use("/greenhouses", greenhouseRoutes);
app.use("/plants", plantRoutes);
app.use("/settings", settingsRoutes);

// Root route
app.get("/", (req, res) => res.send("🌿 GardenAway API running!"));

// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
