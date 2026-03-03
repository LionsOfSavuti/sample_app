import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? '']));
  });
};

router.get('/years', async (_req, res) => {
  const result = await pool.query(
    `SELECT ay.*,
      (SELECT COUNT(*)::int FROM programs p WHERE p.academic_year_id = ay.id) AS program_count,
      (SELECT COUNT(*)::int FROM terms t WHERE t.academic_year_id = ay.id) AS term_count
     FROM academic_years ay
     ORDER BY ay.created_at DESC`
  );
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

router.post('/years/:id/set-current', async (req, res) => {
  await pool.query('UPDATE academic_years SET is_current = false');
  const r = await pool.query('UPDATE academic_years SET is_current = true WHERE id = $1 RETURNING *', [req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Year not found' });
  res.json(r.rows[0]);
});

router.post('/years/:id/archive', async (req, res) => {
  const r = await pool.query('UPDATE academic_years SET is_archived = true, is_current = false WHERE id = $1 RETURNING *', [req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Year not found' });
  res.json(r.rows[0]);
});

router.post('/years/:id/restore', async (req, res) => {
  const r = await pool.query('UPDATE academic_years SET is_archived = false WHERE id = $1 RETURNING *', [req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Year not found' });
  res.json(r.rows[0]);
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

router.get('/time-slots', async (req, res) => {
  const { program_id, academic_year } = req.query;
  const q = await pool.query(
    'SELECT * FROM time_slots WHERE program_id = $1 AND academic_year = $2 ORDER BY day_of_week, start_time',
    [program_id, academic_year]
  );
  res.json(q.rows);
});

router.post('/time-slots', async (req, res) => {
  const { day_of_week, start_time, end_time, slot_name, program_id, academic_year } = req.body;
  const q = await pool.query(
    `INSERT INTO time_slots(day_of_week,start_time,end_time,slot_name,program_id,academic_year)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (day_of_week,start_time,program_id,academic_year)
     DO UPDATE SET end_time = EXCLUDED.end_time, slot_name = EXCLUDED.slot_name
     RETURNING *`,
    [day_of_week, start_time, end_time, slot_name, program_id, academic_year]
  );
  res.status(201).json(q.rows[0]);
});

router.get('/course-sections', async (req, res) => {
  const { program_id, academic_year } = req.query;
  const q = await pool.query(
    `SELECT cs.id, cs.section_name, c.code, c.name, c.term
     FROM course_sections cs
     JOIN courses c ON c.id = cs.course_id
     WHERE cs.program_id = $1 AND cs.academic_year = $2
     ORDER BY c.code, cs.section_name`,
    [program_id, academic_year]
  );
  res.json(q.rows);
});

router.get('/classrooms', async (req, res) => {
  const { program_id, academic_year } = req.query;
  const q = await pool.query(
    'SELECT * FROM classrooms WHERE program_id = $1 AND academic_year = $2 ORDER BY name',
    [program_id, academic_year]
  );
  res.json(q.rows);
});

router.post('/import/courses', async (req, res) => {
  const { csv, program_id, academic_year } = req.body;
  const rows = parseCsv(csv || '');
  let inserted = 0;

  for (const row of rows) {
    const code = row.code;
    const name = row.name;
    const credits = Number(row.credits || 1);
    const term = Number(row.term || 1);
    const section = row.section || 'A';

    if (!code || !name) continue;

    const c = await pool.query(
      `INSERT INTO courses(name,code,credits,term,program_id,academic_year)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (code,term,program_id,academic_year)
       DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits
       RETURNING id`,
      [name, code, credits, term, program_id, academic_year]
    );

    await pool.query(
      `INSERT INTO course_sections(course_id,section_name,program_id,academic_year)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT DO NOTHING`,
      [c.rows[0].id, section, program_id, academic_year]
    );
    inserted += 1;
  }

  res.json({ inserted, total: rows.length });
});

router.post('/import/students', async (req, res) => {
  const { csv, program_id, academic_year } = req.body;
  const rows = parseCsv(csv || '');
  let inserted = 0;

  for (const row of rows) {
    if (!row.student_id || !row.name) continue;
    await pool.query(
      `INSERT INTO students(student_id,name,email,section,program_id,academic_year)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (student_id)
       DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, section = EXCLUDED.section`,
      [row.student_id, row.name, row.email || null, row.section || null, program_id, academic_year]
    );
    inserted += 1;
  }

  res.json({ inserted, total: rows.length });
});

export default router;
