import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const router = express.Router();
const useSSL = false;
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      user: process.env.PGUSER || 'admin',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'greenhouse',
      password: process.env.PGPASSWORD || '1234',
      port: process.env.PGPORT || 5432,
      ssl: false,
    });
const secret=process.env.JWT_SECRET|| 'veryverycomplicatedsecret'

//Helper: Generate JWT
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, display_name, last_login_at ,password_hash FROM app_user ORDER BY id ASC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =========================
// REGISTER (POST /auth/register)
// =========================
router.post('/register', async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    // Check if already exists
    const existing = await pool.query('SELECT id FROM app_user WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Email already registered' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const { rows } = await pool.query(
      `INSERT INTO app_user (email, display_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name`,
      [email, displayName || email.split('@')[0], passwordHash]
    );
    const user = rows[0];
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.email,
        name: user.display_name,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});


// =========================
// LOGIN (POST /auth/login)
// =========================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows } = await pool.query(
      'SELECT id, email, display_name, password_hash FROM app_user WHERE email = $1',
      [email]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user);

    await pool.query('UPDATE app_user SET last_login_at = NOW() WHERE id = $1', [user.id]);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.email,
        name: user.display_name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error,hello' });
  }
});

export default router;