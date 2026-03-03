import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/db-client';
import { useAuth } from '../contexts/AuthContext';

type Invitation = {
  id: string;
  email: string;
  role: string;
  accepted: boolean;
  expires_at: string;
  invite_link?: string;
};

export default function InvitationsPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [msg, setMsg] = useState('');

  const load = async () => {
    if (user?.role !== 'admin') return;
    setRows(await api.invitations.list());
  };

  useEffect(() => {
    load().catch(() => {});
  }, [user?.role]);

  if (user?.role !== 'admin') return null;

  const createInvite = async (e: FormEvent) => {
    e.preventDefault();
    const out = await api.invitations.create({ email, role });
    setMsg(`Invitation link (share securely): ${out.invite_link}`);
    setEmail('');
    await load();
  };

  return (
    <section className="bg-white p-4 rounded shadow mt-4">
      <h2 className="font-semibold mb-2">User Invitations</h2>
      <form onSubmit={createInvite} className="grid md:grid-cols-3 gap-2 mb-3">
        <input className="border p-2" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="border p-2" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="staff">staff</option>
          <option value="faculty">faculty</option>
          <option value="admin">admin</option>
        </select>
        <button className="bg-blue-700 text-white rounded px-3">Invite User</button>
      </form>
      {msg && <p className="text-xs break-all text-slate-700 mb-2">{msg}</p>}
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="border p-2 rounded flex justify-between items-center">
            <span>{r.email} ({r.role}) - {r.accepted ? 'accepted' : 'pending'}</span>
            <button className="text-blue-700" onClick={async () => {
              const out = await api.invitations.resend(r.id);
              setMsg(`Resent link: ${out.invite_link}`);
              await load();
            }}>Resend</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
