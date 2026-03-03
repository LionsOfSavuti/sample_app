import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 3001;

const pool = new Pool({
  host: process.env.DB_HOST || process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.DB_NAME || process.env.VITE_DB_NAME || 'academic_scheduler',
  user: process.env.DB_USER || process.env.VITE_DB_USER || 'scheduler_admin',
  password: process.env.DB_PASSWORD || process.env.VITE_DB_PASSWORD || '',
});

app.use(cors());
app.use(express.json());

app.post('/api/query', async (req, res) => {
  const { text, params } = req.body;
  try {
    const result = await pool.query(text, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
