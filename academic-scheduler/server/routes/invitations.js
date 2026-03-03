import crypto from 'crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db/pool.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireRole('admin'), async (_req, res) => {
  const q = await pool.query('SELECT * FROM user_invitations ORDER BY created_at DESC');
  res.json(q.rows);
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { email, role = 'staff', expiresHours = 72 } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + Number(expiresHours) * 3600 * 1000);

  const q = await pool.query(
    `INSERT INTO user_invitations (email, role, invitation_token, expires_at, accepted, created_by)
     VALUES ($1,$2,$3,$4,false,$5)
     ON CONFLICT (email)
     DO UPDATE SET role = EXCLUDED.role, invitation_token = EXCLUDED.invitation_token, expires_at = EXCLUDED.expires_at, accepted = false, created_by = EXCLUDED.created_by
     RETURNING *`,
    [email, role, token, expiresAt, req.user.id]
  );

  const invite = q.rows[0];
  const inviteLink = `${process.env.APP_BASE_URL || 'http://localhost:8080'}/accept-invite?token=${invite.invitation_token}`;
  res.status(201).json({ ...invite, invite_link: inviteLink });
});

router.post('/:id/resend', requireRole('admin'), async (req, res) => {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 3600 * 1000);
  const q = await pool.query(
    `UPDATE user_invitations
     SET invitation_token = $1, expires_at = $2, accepted = false
     WHERE id = $3
     RETURNING *`,
    [token, expiresAt, req.params.id]
  );
  if (!q.rows[0]) return res.status(404).json({ error: 'Invitation not found' });
  const inviteLink = `${process.env.APP_BASE_URL || 'http://localhost:8080'}/accept-invite?token=${q.rows[0].invitation_token}`;
  res.json({ ...q.rows[0], invite_link: inviteLink });
});

router.post('/accept', async (req, res) => {
  const { token, username, password } = req.body;
  if (!token || !username || !password) return res.status(400).json({ error: 'token, username, password required' });

  const inv = await pool.query('SELECT * FROM user_invitations WHERE invitation_token = $1', [token]);
  const row = inv.rows[0];
  if (!row) return res.status(404).json({ error: 'Invalid invitation token' });
  if (row.accepted) return res.status(400).json({ error: 'Invitation already accepted' });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Invitation expired' });

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO admin_users(username, password, email, role) VALUES ($1,$2,$3,$4)',
    [username, hash, row.email, row.role]
  );
  await pool.query('UPDATE user_invitations SET accepted = true WHERE id = $1', [row.id]);

  res.json({ success: true });
});

export default router;
