import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

router.get('/overview', async (req, res) => {
  const programId = req.query.program_id;
  const whereProgram = programId ? ' WHERE program_id = $1 ' : '';
  const params = programId ? [programId] : [];

  const [faculty, courses, students, scheduled] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM faculty ${whereProgram}`, params),
    pool.query(`SELECT COUNT(*)::int AS count FROM courses ${whereProgram}`, params),
    pool.query(`SELECT COUNT(*)::int AS count FROM students ${whereProgram}`, params),
    pool.query(`SELECT COUNT(*)::int AS count FROM scheduled_classes ${whereProgram}`, params),
  ]);

  res.json({
    faculty: faculty.rows[0].count,
    courses: courses.rows[0].count,
    students: students.rows[0].count,
    scheduledClasses: scheduled.rows[0].count,
  });
});

export default router;
