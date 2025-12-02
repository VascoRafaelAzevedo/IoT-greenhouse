import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dbService } from "./services/dbService.js";
import { mqttService } from "./services/mqttService.js";
import greenhouseRoutes from "./routes/greenhouseRoutes.js";
import plantRoutes from "./routes/plantRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import authDbRoutes from "./routes/authDbRoutes.js";
import greenhouseDbRoutes from "./routes/greenhouseDbRoutes.js";
import plantDbRoutes from "./routes/plantsDbRoutes.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',        
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());


mqttService.connect();

// Routes
app.use("/auth", authDbRoutes);
app.use("/greenhouses", greenhouseDbRoutes);
app.use("/plants", plantDbRoutes);
app.use("/settings", settingsRoutes);

// Root route
app.get("/", (req, res) => res.send("🌿 GardenAway API running!"));

// Start server
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
