import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Pool } from "pg"; // for PostgreSQL

dotenv.config();

const USE_MOCK_DB = process.env.USE_MOCK_DB === "true";
const DATA_DIR = path.resolve("../data");

const dataPath = (collection) => path.join(DATA_DIR, `${collection}.json`);

let pgPool;
if (!USE_MOCK_DB) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

const readJSON = (collection) => {
  const filePath = dataPath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8"); // initialize empty array
  }
  try {
    const content = fs.readFileSync(filePath, "utf8");
    if (!content) return [];
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading JSON for ${collection}:`, err.message);
    return [];
  }
};

const writeJSON = (collection, data) => {
  const filePath = dataPath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error(`Error writing JSON for ${collection}:`, err.message);
    return false;
  }
};

export const dbService = {
  async connect() {
    if (USE_MOCK_DB) {
      console.log("🗃️ Using mock JSON data");
    } else {
      try {
        await pgPool.connect();
        console.log("✅ Connected to PostgreSQL");
      } catch (err) {
        console.error("❌ PostgreSQL connection failed:", err.message);
      }
    }
  },

  async getAll(collection) {
    if (USE_MOCK_DB) {
      return readJSON(collection);
    } else {
      const res = await pgPool.query(`SELECT * FROM ${collection}`);
      return res.rows;
    }
  },

  async getOne(collection, id) {
    if (USE_MOCK_DB) {
      const data = readJSON(collection);
      return data.find((item) => item.id === id) || null;
    } else {
      const res = await pgPool.query(
        `SELECT * FROM ${collection} WHERE id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }
  },

  async create(collection, item) {
    if (USE_MOCK_DB) {
      const data = readJSON(collection);
      const newItem = { id: crypto.randomUUID(), ...item };
      data.push(newItem);
      writeJSON(collection, data);
      return newItem;
    } else {
      // Postgres create placeholder
      const keys = Object.keys(item);
      const values = Object.values(item);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
      const res = await pgPool.query(
        `INSERT INTO ${collection} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      return res.rows[0];
    }
  },

  async update(collection, id, updates) {
    if (USE_MOCK_DB) {
      const data = readJSON(collection);
      const index = data.findIndex((i) => i.id === id);
      if (index === -1) throw new Error("Not found");
      data[index] = { ...data[index], ...updates };
      writeJSON(collection, data);
      return data[index];
    } else {
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map((k, i) => `${k}=$${i + 1}`).join(", ");
      const res = await pgPool.query(
        `UPDATE ${collection} SET ${setClause} WHERE id=$${keys.length + 1} RETURNING *`,
        [...values, id]
      );
      return res.rows[0];
    }
  },
  async getSettings() {
    const defaultSettings = {
      notifications: {
        alerts: true,
        email: true,
        push: false,
        quietHours: true,
        quietStart: "22:00",
        quietEnd: "07:00",
      },
      units: {
        temperature: "celsius",
        language: "english",
      },
      alerts: {
        temperatureVariance: 3,
        humidityVariance: 10,
        waterLevelThreshold: 20,
        offlineTimeout: 30,
      },
      display: {
        darkMode: false,
        refreshRate: 30,
        compactView: false,
      },
    };

    return defaultSettings;
  },
  async delete(collection, id) {
    if (USE_MOCK_DB) {
      const data = readJSON(collection);
      const index = data.findIndex((i) => i.id === id);
      if (index === -1) throw new Error("Not found");
      const removed = data.splice(index, 1)[0];
      writeJSON(collection, data);
      return removed;
    } else {
      const res = await pgPool.query(
        `DELETE FROM ${collection} WHERE id=$1 RETURNING *`,
        [id]
      );
      return res.rows[0];
    }
  },
};
