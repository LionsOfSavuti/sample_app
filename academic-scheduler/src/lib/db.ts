import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DB_PORT || '5432', 10),
  database: import.meta.env.VITE_DB_NAME || 'academic_scheduler',
  user: import.meta.env.VITE_DB_USER || 'scheduler_admin',
  password: import.meta.env.VITE_DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = async (text: string, params?: unknown[]) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export default pool;
