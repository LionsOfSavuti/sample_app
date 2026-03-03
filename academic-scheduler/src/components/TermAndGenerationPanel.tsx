import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/db-client';
import { usePrograms } from '../contexts/ProgramContext';
import type { Term } from '../types';
import { useScheduling } from '../hooks/useScheduling';

export default function TermAndGenerationPanel() {
  const { programs } = usePrograms();
  const [programId, setProgramId] = useState('');
  const [terms, setTerms] = useState<Term[]>([]);
  const { loading, generate } = useScheduling();
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name: 'Term 1', term_number: 1, start_date: '', end_date: '', academic_year_id: '', program_id: '' });

  useEffect(() => {
    if (!programId) return;
    api.terms.list(programId).then(setTerms).catch(() => {});
  }, [programId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await api.terms.create(form);
    const rows = await api.terms.list(form.program_id);
    setTerms(rows);
  };

  return (
    <section className="bg-white p-4 rounded shadow mt-4">
      <h2 className="font-semibold mb-2">Terms & Calendar Generation</h2>
      <form onSubmit={submit} className="grid md:grid-cols-5 gap-2 mb-4">
        <select className="border p-2" value={form.program_id} onChange={(e) => {
          const p = programs.find((x) => x.id === e.target.value);
          setProgramId(e.target.value);
          setForm({ ...form, program_id: e.target.value, academic_year_id: p?.academic_year_id || '' });
        }}>
          <option value="">Program</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
        </select>
        <input className="border p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="number" min={1} max={3} className="border p-2" value={form.term_number} onChange={(e) => setForm({ ...form, term_number: Number(e.target.value) })} />
        <input type="date" className="border p-2" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <input type="date" className="border p-2" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        <button className="bg-blue-700 text-white px-3 py-1 rounded md:col-span-5">Create Term</button>
      </form>

      <ul className="space-y-2">
        {terms.map((t) => (
          <li key={t.id} className="flex items-center justify-between border p-2 rounded">
            <span>{t.name} ({t.start_date} → {t.end_date})</span>
            <button
              className="bg-slate-800 text-white px-3 py-1 rounded"
              onClick={async () => {
                const out = await generate(t.id);
                setMsg(`Generated ${out.generated} classes for ${t.name}`);
              }}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Calendar'}
            </button>
          </li>
        ))}
      </ul>
      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
    </section>
  );
}
