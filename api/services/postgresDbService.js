import pkg from 'pg';
const { Pool } = pkg;

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // use ssl in prod (common for cloud DBs)
    })
  : new Pool({
      user: process.env.PGUSER || 'admin',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'greenhouse',
      password: process.env.PGPASSWORD || '1234',
      port: process.env.PGPORT || 5432,
      ssl: false,
    });

export default pool;

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}