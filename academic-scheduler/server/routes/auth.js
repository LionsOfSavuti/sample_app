import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });

  const result = await pool.query('SELECT id, username, password, role, email FROM admin_users WHERE username = $1', [username]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '12h' }
  );

  return res.json({ token, user: { id: user.id, username: user.username, role: user.role, email: user.email } });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await pool.query('SELECT password FROM admin_users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) return res.status(400).json({ error: 'Current password incorrect' });

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE admin_users SET password = $1 WHERE id = $2', [hash, req.user.id]);
  return res.json({ success: true });
});

router.get('/me', requireAuth, async (req, res) => res.json({ user: req.user }));

export default router;
