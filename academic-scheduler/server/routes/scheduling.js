import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

const jsToDbDay = (jsDay) => (jsDay === 0 ? 7 : jsDay);

router.post('/generate/:termId', async (req, res) => {
  const { termId } = req.params;

  const termQ = await pool.query('SELECT * FROM terms WHERE id = $1', [termId]);
  const term = termQ.rows[0];
  if (!term) return res.status(404).json({ error: 'Term not found' });

  const settingsQ = await pool.query('SELECT * FROM term_settings WHERE term_id = $1 LIMIT 1', [termId]);
  const settings = settingsQ.rows[0];
  const blockedDays = new Set((settings?.blocked_days || []).map((d) => d.toLowerCase()));

  const noClassQ = await pool.query('SELECT start_date, end_date FROM no_class_periods WHERE term_id = $1', [termId]);
  const noClass = noClassQ.rows;

  const schedulesQ = await pool.query(
    `SELECT s.*, ts.day_of_week, ts.start_time, ts.end_time, cs.section_name, c.id AS course_id, c.credits, c.code
     FROM schedules s
     JOIN time_slots ts ON ts.id = s.time_slot_id
     JOIN course_sections cs ON cs.id = s.course_section_id
     JOIN courses c ON c.id = cs.course_id
     WHERE s.term_id = $1`,
    [termId]
  );

  const maxForCredits = (credits) => (Number(credits) === 0.5 ? 10 : 20);
  const counts = new Map();
  const inserts = [];

  const start = new Date(term.start_date);
  const end = new Date(term.end_date);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (blockedDays.has(dayName)) continue;

    const inNoClass = noClass.some((p) => d >= new Date(p.start_date) && d <= new Date(p.end_date));
    if (inNoClass) continue;

    const dayOfWeek = jsToDbDay(d.getDay());
    for (const sch of schedulesQ.rows) {
      if (sch.day_of_week !== dayOfWeek) continue;

      const key = `${sch.course_id}-${sch.section_name}`;
      const next = (counts.get(key) || 0) + 1;
      if (next > maxForCredits(sch.credits)) continue;

      counts.set(key, next);
      inserts.push([
        term.id,
        sch.id,
        sch.course_id,
        sch.section_name,
        d.toISOString().slice(0, 10),
        next,
        `${sch.start_time}-${sch.end_time}`,
        d.toLocaleDateString('en-US', { weekday: 'long' }),
        'scheduled',
        sch.program_id,
        sch.academic_year,
      ]);
    }
  }

  for (let i = 0; i < inserts.length; i += 100) {
    const batch = inserts.slice(i, i + 100);
    const values = [];
    const placeholders = batch
      .map((r, idx) => {
        const base = idx * 11;
        values.push(...r);
        return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11})`;
      })
      .join(',');

    await pool.query(
      `INSERT INTO scheduled_classes
      (term_id,schedule_id,course_id,section,class_date,class_number,time_slot,day_of_week,status,program_id,academic_year)
      VALUES ${placeholders}`,
      values
    );
  }

  res.json({ generated: inserts.length });
});

router.post('/assign', async (req, res) => {
  const { term_id, course_section_id, time_slot_id, classroom_id = null, program_id, academic_year } = req.body;
  if (!term_id || !course_section_id || !time_slot_id || !program_id || !academic_year) {
    return res.status(400).json({ error: 'term_id, course_section_id, time_slot_id, program_id, academic_year required' });
  }

  await pool.query('DELETE FROM schedules WHERE term_id = $1 AND course_section_id = $2', [term_id, course_section_id]);

  const q = await pool.query(
    `INSERT INTO schedules(course_section_id,time_slot_id,classroom_id,term_id,program_id,academic_year)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [course_section_id, time_slot_id, classroom_id, term_id, program_id, academic_year]
  );
  res.status(201).json(q.rows[0]);
});

router.delete('/clear/:termId', async (req, res) => {
  const { termId } = req.params;
  await pool.query('DELETE FROM schedules WHERE term_id = $1', [termId]);
  await pool.query('DELETE FROM scheduled_classes WHERE term_id = $1', [termId]);
  res.json({ success: true });
});

router.get('/weekly', async (req, res) => {
  const { term_id } = req.query;
  if (!term_id) return res.status(400).json({ error: 'term_id is required' });

  const q = await pool.query(
    `SELECT ts.day_of_week, ts.start_time, ts.end_time, ts.slot_name,
            c.code AS course_code, c.name AS course_name, cs.section_name,
            f.name AS faculty_name, cr.name AS classroom_name
     FROM schedules s
     JOIN time_slots ts ON ts.id = s.time_slot_id
     JOIN course_sections cs ON cs.id = s.course_section_id
     JOIN courses c ON c.id = cs.course_id
     LEFT JOIN faculty f ON f.id = cs.faculty_id
     LEFT JOIN classrooms cr ON cr.id = s.classroom_id
     WHERE s.term_id = $1
     ORDER BY ts.start_time, ts.day_of_week`,
    [term_id]
  );

  res.json(q.rows);
});

export default router;
