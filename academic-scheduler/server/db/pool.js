import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || process.env.VITE_DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.VITE_DB_PORT || '5432', 10),
  database: process.env.DB_NAME || process.env.VITE_DB_NAME || 'academic_scheduler',
  user: process.env.DB_USER || process.env.VITE_DB_USER || 'scheduler_admin',
  password: process.env.DB_PASSWORD || process.env.VITE_DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
});

export default pool;
