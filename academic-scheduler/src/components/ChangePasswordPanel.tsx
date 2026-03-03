import { FormEvent, useState } from 'react';
import { api } from '../lib/db-client';

export default function ChangePasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (newPassword !== confirmPassword) {
      setErr('New passwords do not match');
      return;
    }
    try {
      await api.changePassword(currentPassword, newPassword);
      setMsg('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErr((error as Error).message);
    }
  };

  return (
    <section className="bg-white p-4 rounded shadow mt-4">
      <h2 className="font-semibold mb-2">Change Password</h2>
      <form onSubmit={submit} className="grid md:grid-cols-4 gap-2">
        <input className="border p-2" type="password" placeholder="Current" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input className="border p-2" type="password" placeholder="New" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input className="border p-2" type="password" placeholder="Confirm New" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button className="bg-blue-700 text-white rounded px-3">Update</button>
      </form>
      {msg && <p className="text-green-700 text-sm mt-2">{msg}</p>}
      {err && <p className="text-red-700 text-sm mt-2">{err}</p>}
    </section>
  );
}
