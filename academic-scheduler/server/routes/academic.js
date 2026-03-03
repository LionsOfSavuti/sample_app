import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

const normalizeHeader = (value) => value
  .replace(/^\uFEFF/, '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const parseCsvLine = (line) => {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
};

const parseCsv = (text) => {
  const rawLines = (text || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.trim().length > 0);

  if (rawLines.length < 2) return [];

  const headers = parseCsvLine(rawLines[0]).map(normalizeHeader);

  return rawLines.slice(1).map((line, index) => {
    const cols = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, i) => [header, cols[i] ?? '']));
    return { rowNumber: index + 2, row, headers };
  });
};

const parseTermNumber = (value) => {
  const source = String(value || '').trim().toLowerCase();
  if (!source) return 1;

  if (['1', 'term_1', 'term_i', 'term_i_'].includes(source)) return 1;
  if (['2', 'term_2', 'term_ii'].includes(source)) return 2;
  if (['3', 'term_3', 'term_iii'].includes(source)) return 3;

  if (source.includes('term vi') || source.includes('term_vi') || source === '6') return 3;
  if (source.includes('term v') || source.includes('term_v') || source === '5') return 2;
  if (source.includes('term iv') || source.includes('term_iv') || source === '4') return 1;

  const parsed = Number(source.replace(/[^0-9]/g, ''));
  if (parsed === 4) return 1;
  if (parsed === 5) return 2;
  if (parsed === 6) return 3;
  if ([1, 2, 3].includes(parsed)) return parsed;

  return 1;
};

const enrollmentToRollNumber = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;

  const match = trimmed.match(/\(([^)]+)\)\s*$/);
  if (match) return match[1].trim();
  return trimmed;
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

  const parsedRows = parseCsv(csv || '');
  let inserted = 0;
  let skipped = 0;
  let enrollmentsInserted = 0;
  let facultyCreated = 0;
  let studentsCreated = 0;
  const rowErrors = [];

  for (const { rowNumber, row, headers } of parsedRows) {
    const code = row.course_code || row.code;
    const name = row.course_name || row.name;
    const credits = Number(row.credits || 1);
    const term = parseTermNumber(row.term);
    const section = row.section || 'A';
    const professorName = (row.professor || '').trim();
    const maxSeats = Number(row.max_seats || 60) || 60;

    if (!code || !name) {
      skipped += 1;
      rowErrors.push({ row: rowNumber, reason: 'Missing Course Code or Course Name' });
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const courseUpsert = await client.query(
        `INSERT INTO courses(name,code,credits,term,program_id,academic_year)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (code,term,program_id,academic_year)
         DO UPDATE SET name = EXCLUDED.name, credits = EXCLUDED.credits
         RETURNING id`,
        [name, code, credits, term, program_id, academic_year]
      );
      const courseId = courseUpsert.rows[0].id;

      let facultyId = null;
      if (professorName) {
        const existingFaculty = await client.query(
          'SELECT id FROM faculty WHERE program_id = $1 AND academic_year = $2 AND LOWER(name) = LOWER($3) LIMIT 1',
          [program_id, academic_year, professorName]
        );

        if (existingFaculty.rows[0]) {
          facultyId = existingFaculty.rows[0].id;
        } else {
          const facultyInsert = await client.query(
            `INSERT INTO faculty(name,email,department,program_id,academic_year)
             VALUES ($1,$2,$3,$4,$5)
             RETURNING id`,
            [professorName, `${professorName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@example.com`, null, program_id, academic_year]
          );
          facultyId = facultyInsert.rows[0].id;
          facultyCreated += 1;
        }
      }

      let sectionId;
      const sectionExisting = await client.query(
        `SELECT id FROM course_sections
         WHERE course_id = $1 AND section_name = $2 AND program_id = $3 AND academic_year = $4
         LIMIT 1`,
        [courseId, section, program_id, academic_year]
      );

      if (sectionExisting.rows[0]) {
        sectionId = sectionExisting.rows[0].id;
        await client.query(
          'UPDATE course_sections SET max_students = $1, faculty_id = COALESCE($2, faculty_id) WHERE id = $3',
          [maxSeats, facultyId, sectionId]
        );
      } else {
        const sectionInsert = await client.query(
          `INSERT INTO course_sections(course_id,section_name,faculty_id,max_students,program_id,academic_year)
           VALUES ($1,$2,$3,$4,$5,$6)
           RETURNING id`,
          [courseId, section, facultyId, maxSeats, program_id, academic_year]
        );
        sectionId = sectionInsert.rows[0].id;
      }

      const enrollmentHeaders = headers.filter((h) => /^\d+$/.test(h) || /^student_\d+$/.test(h));

      for (const enrollmentHeader of enrollmentHeaders) {
        const value = row[enrollmentHeader];
        if (!value) continue;

        const rollNumber = enrollmentToRollNumber(value);
        if (!rollNumber) continue;

        let studentId;
        const studentLookup = await client.query(
          'SELECT id FROM students WHERE student_id = $1 AND program_id = $2 AND academic_year = $3 LIMIT 1',
          [rollNumber, program_id, academic_year]
        );

        if (studentLookup.rows[0]) {
          studentId = studentLookup.rows[0].id;
        } else {
          const studentInsert = await client.query(
            `INSERT INTO students(student_id,name,email,section,program_id,academic_year)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (student_id)
             DO UPDATE SET name = COALESCE(students.name, EXCLUDED.name)
             RETURNING id`,
            [rollNumber, value.includes('(') ? value.replace(/\s*\([^)]*\)\s*$/, '') : rollNumber, null, section, program_id, academic_year]
          );
          studentId = studentInsert.rows[0].id;
          studentsCreated += 1;
        }

        await client.query(
          `INSERT INTO course_enrollments(student_id,course_section_id,program_id,academic_year)
           SELECT $1,$2,$3,$4
           WHERE NOT EXISTS (
             SELECT 1 FROM course_enrollments
             WHERE student_id = $1 AND course_section_id = $2 AND program_id = $3 AND academic_year = $4
           )`,
          [studentId, sectionId, program_id, academic_year]
        );
        enrollmentsInserted += 1;
      }

      await client.query('COMMIT');
      inserted += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      skipped += 1;
      rowErrors.push({ row: rowNumber, reason: error.message });
    } finally {
      client.release();
    }
  }

  res.json({
    message: `Course upload completed. ${inserted} row(s) processed successfully.`,
    inserted,
    skipped,
    total: parsedRows.length,
    enrollments_inserted: enrollmentsInserted,
    faculty_created: facultyCreated,
    students_created: studentsCreated,
    expected_columns: [
      'Term',
      'Programme',
      'Area',
      'Course Name',
      'Course Code',
      'Section',
      'Credits',
      'Professor',
      'Max Seats',
      'Confirmed Seats',
      '1...75 (student enrollments)',
    ],
    row_errors: rowErrors.slice(0, 20),
  });
});

router.post('/import/students', async (req, res) => {
  const { csv, program_id, academic_year } = req.body;
  if (!program_id || !academic_year) return res.status(400).json({ error: 'program_id and academic_year are required' });

  const parsedRows = parseCsv(csv || '');
  let inserted = 0;
  let skipped = 0;
  const rowErrors = [];

  for (const { rowNumber, row } of parsedRows) {
    const studentId = row.student_id || row.roll_number || row.roll_no || row.rollnumber;
    const studentName = row.name || row.student_name;

    if (!studentId || !studentName) {
      skipped += 1;
      rowErrors.push({ row: rowNumber, reason: 'Missing Roll Number/Student ID or Student Name' });
      continue;
    }

    await pool.query(
      `INSERT INTO students(student_id,name,email,section,program_id,academic_year)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (student_id)
       DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, section = EXCLUDED.section`,
      [studentId, studentName, row.email || null, row.section || null, program_id, academic_year]
    );
    inserted += 1;
  }

  res.json({
    message: `Student upload completed. ${inserted} row(s) inserted/updated.`,
    inserted,
    skipped,
    total: parsedRows.length,
    expected_columns: ['Roll Number|student_id', 'Student Name|name', 'Email|email', 'Section(optional)'],
    row_errors: rowErrors.slice(0, 20),
  });
});

export default router;
