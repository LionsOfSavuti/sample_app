import { FormEvent, useState } from 'react';
import { api } from '../lib/db-client';
import { useAcademicYears } from '../contexts/AcademicYearContext';
import { usePrograms } from '../contexts/ProgramContext';

export default function YearProgramPanel() {
  const { years, reload: reloadYears } = useAcademicYears();
  const { programs, setAcademicYearId, reload: reloadPrograms } = usePrograms();
  const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '' });
  const [programForm, setProgramForm] = useState({ name: '', code: '', academic_year_id: '' });

  const addYear = async (e: FormEvent) => {
    e.preventDefault();
    await api.years.create({ ...yearForm, is_current: true });
    setYearForm({ name: '', start_date: '', end_date: '' });
    await reloadYears();
  };

  const addProgram = async (e: FormEvent) => {
    e.preventDefault();
    await api.programs.create(programForm);
    setProgramForm({ name: '', code: '', academic_year_id: '' });
    await reloadPrograms();
  };

  return (
    <section className="grid md:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Academic Years</h2>
        <form onSubmit={addYear} className="space-y-2 mb-3">
          <input className="border p-2 w-full" placeholder="2024-2025" value={yearForm.name} onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })} />
          <input type="date" className="border p-2 w-full" value={yearForm.start_date} onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })} />
          <input type="date" className="border p-2 w-full" value={yearForm.end_date} onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })} />
          <button className="bg-blue-700 text-white px-3 py-1 rounded">Add Year</button>
        </form>
        <ul className="text-sm space-y-2">
          {years.map((y) => (
            <li key={y.id} className="border rounded p-2">
              <div className="font-medium">{y.name} {y.is_current ? '(current)' : ''} {y.is_archived ? '(archived)' : ''}</div>
              <div className="text-xs text-slate-600">Programs: {(y as any).program_count ?? 0}, Terms: {(y as any).term_count ?? 0}</div>
              <div className="flex gap-2 mt-2">
                {!y.is_current && <button className="text-blue-700" onClick={async () => { await api.years.setCurrent(y.id); await reloadYears(); }}>Set Current</button>}
                {!y.is_archived ? (
                  <button className="text-amber-700" onClick={async () => { await api.years.archive(y.id); await reloadYears(); }}>Archive</button>
                ) : (
                  <button className="text-green-700" onClick={async () => { await api.years.restore(y.id); await reloadYears(); }}>Restore</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Programs</h2>
        <form onSubmit={addProgram} className="space-y-2 mb-3">
          <select className="border p-2 w-full" value={programForm.academic_year_id} onChange={(e) => {
            setProgramForm({ ...programForm, academic_year_id: e.target.value });
            setAcademicYearId(e.target.value);
          }}>
            <option value="">Select academic year</option>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <input className="border p-2 w-full" placeholder="Computer Science" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} />
          <input className="border p-2 w-full" placeholder="CS" value={programForm.code} onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })} />
          <button className="bg-blue-700 text-white px-3 py-1 rounded">Add Program</button>
        </form>
        <ul className="text-sm space-y-1">{programs.map((p) => <li key={p.id}>{p.code} - {p.name}</li>)}</ul>
      </div>
    </section>
  );
}
