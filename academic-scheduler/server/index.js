import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db/pool.js';
import authRoutes from './routes/auth.js';
import academicRoutes from './routes/academic.js';
import schedulingRoutes from './routes/scheduling.js';
import invitationRoutes from './routes/invitations.js';
import statsRoutes from './routes/stats.js';
import { requireAuth, requireRole } from './middleware/auth.js';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/academic', requireAuth, academicRoutes);
app.use('/api/scheduling', requireAuth, schedulingRoutes);
app.use('/api/invitations', requireAuth, invitationRoutes);
app.use('/api/stats', requireAuth, statsRoutes);

app.post('/api/query', requireAuth, requireRole('admin', 'staff'), async (req, res) => {
  const { text, params } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const result = await pool.query(text, params || []);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
