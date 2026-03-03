import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

const parseCsv = (text) => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

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

router.get('/no-class-periods', async (req, res) => {
  const { term_id } = req.query;
  const q = await pool.query('SELECT * FROM no_class_periods WHERE term_id = $1 ORDER BY start_date', [term_id]);
  res.json(q.rows);
});

router.post('/no-class-periods', async (req, res) => {
  const { term_id, program_id, activity_name, start_date, end_date } = req.body;
  const q = await pool.query(
    `INSERT INTO no_class_periods(term_id,program_id,activity_name,start_date,end_date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [term_id, program_id, activity_name, start_date, end_date]
  );
  res.status(201).json(q.rows[0]);
});

router.get('/faculty', async (req, res) => {
  const { program_id, academic_year } = req.query;
  const q = await pool.query('SELECT * FROM faculty WHERE program_id = $1 AND academic_year = $2 ORDER BY name', [program_id, academic_year]);
  res.json(q.rows);
});

router.post('/faculty', async (req, res) => {
  const { name, email, department, program_id, academic_year } = req.body;
  const q = await pool.query(
    `INSERT INTO faculty(name,email,department,program_id,academic_year)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [name, email, department, program_id, academic_year]
  );
  res.status(201).json(q.rows[0]);
});

router.get('/courses', async (req, res) => {
  const { program_id, academic_year, term } = req.query;
  const q = term
    ? await pool.query('SELECT * FROM courses WHERE program_id = $1 AND academic_year = $2 AND term = $3 ORDER BY code', [program_id, academic_year, term])
    : await pool.query('SELECT * FROM courses WHERE program_id = $1 AND academic_year = $2 ORDER BY code', [program_id, academic_year]);
  res.json(q.rows);
});

router.post('/courses', async (req, res) => {
  const { name, code, credits, term, program_id, academic_year } = req.body;
  const q = await pool.query(
    `INSERT INTO courses(name,code,credits,term,program_id,academic_year)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (code,term,program_id,academic_year)
     DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits
     RETURNING *`,
    [name, code, credits, term, program_id, academic_year]
  );
  res.status(201).json(q.rows[0]);
});

router.get('/students', async (req, res) => {
  const { program_id, academic_year } = req.query;
  const q = await pool.query('SELECT * FROM students WHERE program_id = $1 AND academic_year = $2 ORDER BY name', [program_id, academic_year]);
  res.json(q.rows);
});

router.post('/students', async (req, res) => {
  const { student_id, name, email, section, program_id, academic_year } = req.body;
  const q = await pool.query(
    `INSERT INTO students(student_id,name,email,section,program_id,academic_year)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (student_id)
     DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, section = EXCLUDED.section
     RETURNING *`,
    [student_id, name, email, section, program_id, academic_year]
  );
  res.status(201).json(q.rows[0]);
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
    `SELECT cs.id, cs.section_name, c.code, c.name, c.term,
             COALESCE(COUNT(DISTINCT ce.student_id),0)::int AS students
     FROM course_sections cs
     JOIN courses c ON c.id = cs.course_id
     LEFT JOIN course_enrollments ce ON ce.course_section_id = cs.id
     WHERE cs.program_id = $1 AND cs.academic_year = $2
     GROUP BY cs.id, c.code, c.name, c.term
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

router.post('/classrooms', async (req, res) => {
  const { name, program_id, academic_year, capacity = 60, building = null } = req.body;
  const q = await pool.query(
    `INSERT INTO classrooms(name,capacity,building,program_id,academic_year)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (name)
     DO UPDATE SET capacity = EXCLUDED.capacity, building = EXCLUDED.building
     RETURNING *`,
    [name, capacity, building, program_id, academic_year]
  );
  res.status(201).json(q.rows[0]);
});

router.post('/import/courses', async (req, res) => {
  const { csv, program_id, academic_year } = req.body;
  if (!program_id || !academic_year) return res.status(400).json({ error: 'program_id and academic_year are required' });

  const rows = parseCsv(csv || '');
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const code = row.code;
    const name = row.name;
    const credits = Number(row.credits || 1);
    const term = Number(row.term || 1);
    const section = row.section || 'A';

    if (!code || !name) {
      skipped += 1;
      continue;
    }

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

  res.json({ inserted, skipped, total: rows.length, expected_columns: ['code','name','credits','term','section'] });
});

router.post('/import/students', async (req, res) => {
  const { csv, program_id, academic_year } = req.body;
  if (!program_id || !academic_year) return res.status(400).json({ error: 'program_id and academic_year are required' });

  const rows = parseCsv(csv || '');
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.student_id || !row.name) {
      skipped += 1;
      continue;
    }
    await pool.query(
      `INSERT INTO students(student_id,name,email,section,program_id,academic_year)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (student_id)
       DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, section = EXCLUDED.section`,
      [row.student_id, row.name, row.email || null, row.section || null, program_id, academic_year]
    );
    inserted += 1;
  }

  res.json({ inserted, skipped, total: rows.length, expected_columns: ['student_id','name','email','section'] });
});

export default router;
