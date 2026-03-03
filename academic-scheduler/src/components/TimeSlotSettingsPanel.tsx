import { FormEvent, useState } from 'react';
import { api } from '../lib/db-client';

export default function TimeSlotSettingsPanel() {
  const [programId, setProgramId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [day, setDay] = useState(1);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:30');
  const [name, setName] = useState('Slot 1');
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    if (!programId || !academicYear) return;
    setRows(await api.timeSlots.list(programId, academicYear));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await api.timeSlots.create({ day_of_week: day, start_time: start, end_time: end, slot_name: name, program_id: programId, academic_year: academicYear });
    await load();
  };

  return (
    <section className="bg-white p-4 rounded shadow mt-4">
      <h2 className="font-semibold mb-2">Time Slot Settings (90-min supported)</h2>
      <div className="grid md:grid-cols-2 gap-2 mb-2">
        <input className="border p-2" placeholder="program_id" value={programId} onChange={(e) => setProgramId(e.target.value)} />
        <input className="border p-2" placeholder="academic_year text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
      </div>
      <div className="mb-3">
        <button className="text-blue-700" onClick={load}>Load Slots</button>
      </div>
      <form onSubmit={submit} className="grid md:grid-cols-5 gap-2 mb-3">
        <select className="border p-2" value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {[1,2,3,4,5,6,7].map((d)=> <option key={d} value={d}>Day {d}</option>)}
        </select>
        <input className="border p-2" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        <input className="border p-2" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        <input className="border p-2" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="bg-blue-700 text-white rounded px-3">Save Slot</button>
      </form>
      <ul className="text-sm space-y-1">
        {rows.map((r) => <li key={r.id}>D{r.day_of_week} {r.start_time}-{r.end_time} ({r.slot_name})</li>)}
      </ul>
    </section>
  );
}
