import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/db-client';
import type { Term } from '../types';

type Row = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_name: string;
  course_code: string;
  course_name: string;
  section_name: string;
  faculty_name?: string;
  classroom_name?: string;
};

type SectionCard = { id: string; code: string; name: string; section_name: string; term: number };

type Slot = { id: string; day_of_week: number; start_time: string; end_time: string; slot_name: string };

type Classroom = { id: string; name: string };

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyGrid() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  const [programId, setProgramId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [cards, setCards] = useState<SectionCard[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [dragId, setDragId] = useState('');

  useEffect(() => {
    api.terms.list().then(setTerms).catch(() => {});
  }, []);

  useEffect(() => {
    if (!termId) return;
    api.scheduling.weekly(termId).then(setRows).catch(() => setRows([]));
  }, [termId]);

  const loadSettingsData = async () => {
    if (!programId || !academicYear) return;
    const [c, s, rooms] = await Promise.all([
      api.courseSections.list(programId, academicYear),
      api.timeSlots.list(programId, academicYear),
      api.classrooms.list(programId, academicYear),
    ]);
    setCards(c);
    setSlots(s);
    setClassrooms(rooms);
  };

  const timeHeaders = useMemo(() => Array.from(new Set(slots.map((s) => `${s.start_time}-${s.end_time}`))), [slots]);

  const slotFor = (day: number, time: string) => {
    const [start, end] = time.split('-');
    return slots.find((s) => s.day_of_week === day && s.start_time === start && s.end_time === end);
  };

  const itemsForCell = (day: number, time: string) => {
    const [start, end] = time.split('-');
    return rows.filter((r) => r.day_of_week === day && r.start_time === start && r.end_time === end);
  };

  const onDrop = async (day: number, time: string) => {
    if (!dragId || !termId) return;
    const slot = slotFor(day, time);
    if (!slot) return;
    await api.scheduling.assign({
      term_id: termId,
      course_section_id: dragId,
      time_slot_id: slot.id,
      classroom_id: classrooms[0]?.id || null,
      program_id: programId,
      academic_year: academicYear,
    });
    setRows(await api.scheduling.weekly(termId));
  };

  return (
    <section className="bg-white p-4 rounded shadow mt-4">
      <h2 className="font-semibold mb-2">Weekly Grid (Drag Courses to Slots)</h2>

      <div className="grid md:grid-cols-4 gap-2 mb-3">
        <select className="border p-2" value={termId} onChange={(e) => setTermId(e.target.value)}>
          <option value="">Select term</option>
          {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input className="border p-2" placeholder="program_id" value={programId} onChange={(e) => setProgramId(e.target.value)} />
        <input className="border p-2" placeholder="academic_year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
        <button className="bg-blue-700 text-white rounded px-3" onClick={loadSettingsData}>Load Cards/Slots</button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <aside className="border rounded p-2 max-h-[500px] overflow-y-auto">
          <h3 className="font-medium mb-2">Course Cards</h3>
          {cards.map((c) => (
            <div
              key={c.id}
              draggable
              onDragStart={() => setDragId(c.id)}
              className="cursor-move border rounded p-2 mb-2 bg-slate-50"
            >
              <div className="font-semibold text-blue-800">{c.code}-{c.section_name}</div>
              <div className="text-xs">{c.name}</div>
            </div>
          ))}
        </aside>

        <div className="md:col-span-3 overflow-auto">
          <table className="min-w-full border text-xs">
            <thead>
              <tr>
                <th className="border p-2">Day / Time</th>
                {timeHeaders.map((t) => <th key={t} className="border p-2">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {dayNames.map((day, idx) => (
                <tr key={day}>
                  <td className="border p-2 font-medium">{day}</td>
                  {timeHeaders.map((t) => {
                    const items = itemsForCell(idx + 1, t);
                    return (
                      <td
                        key={t}
                        className="border p-2 align-top min-w-36"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(idx + 1, t)}
                      >
                        {items.length === 0 ? <span className="text-slate-400">Drop here</span> : items.map((item, i) => (
                          <div key={i} className="border rounded p-1 mb-1 bg-blue-50">
                            <div className="font-semibold text-blue-800">{item.course_code}-{item.section_name}</div>
                            <div>{item.classroom_name || 'No room'} / {item.faculty_name || 'TBA'}</div>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
