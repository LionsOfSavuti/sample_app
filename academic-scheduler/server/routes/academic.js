import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

router.get('/years', async (_req, res) => {
  const result = await pool.query('SELECT * FROM academic_years ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/years', async (req, res) => {
  const { name, start_date, end_date, is_current = false } = req.body;
  if (is_current) await pool.query('UPDATE academic_years SET is_current = false');
  const r = await pool.query(
    'INSERT INTO academic_years(name,start_date,end_date,is_current) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, start_date, end_date, is_current]
  );
  res.status(201).json(r.rows[0]);
});

router.get('/programs', async (req, res) => {
  const { academic_year_id } = req.query;
  const q = academic_year_id
    ? await pool.query('SELECT * FROM programs WHERE academic_year_id = $1 ORDER BY created_at DESC', [academic_year_id])
    : await pool.query('SELECT * FROM programs ORDER BY created_at DESC');
  res.json(q.rows);
});

router.post('/programs', async (req, res) => {
  const { name, code, academic_year_id } = req.body;
  const r = await pool.query(
    'INSERT INTO programs(name,code,academic_year_id) VALUES ($1,$2,$3) RETURNING *',
    [name, code, academic_year_id]
  );
  res.status(201).json(r.rows[0]);
});

router.get('/terms', async (req, res) => {
  const { program_id } = req.query;
  const q = program_id
    ? await pool.query('SELECT * FROM terms WHERE program_id = $1 ORDER BY term_number', [program_id])
    : await pool.query('SELECT * FROM terms ORDER BY term_number');
  res.json(q.rows);
});

router.post('/terms', async (req, res) => {
  const { name, term_number, start_date, end_date, academic_year_id, program_id } = req.body;
  const r = await pool.query(
    'INSERT INTO terms(name,term_number,start_date,end_date,academic_year_id,program_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [name, term_number, start_date, end_date, academic_year_id, program_id]
  );
  res.status(201).json(r.rows[0]);
});

export default router;
