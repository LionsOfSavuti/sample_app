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

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeeklyGrid() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState('');
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api.terms.list().then(setTerms).catch(() => {});
  }, []);

  useEffect(() => {
    if (!termId) return;
    api.scheduling.weekly(termId).then(setRows).catch(() => setRows([]));
  }, [termId]);

  const slots = useMemo(() => Array.from(new Set(rows.map((r) => `${r.start_time}-${r.end_time}-${r.slot_name}`))), [rows]);
  const cell = (slot: string, day: number) => {
    const [start, end] = slot.split('-');
    return rows.find((r) => r.start_time === start && r.end_time === end && r.day_of_week === day);
  };

  return (
    <section className="bg-white p-4 rounded shadow mt-4 overflow-auto">
      <h2 className="font-semibold mb-2">Weekly Timetable Grid</h2>
      <select className="border p-2 mb-3" value={termId} onChange={(e) => setTermId(e.target.value)}>
        <option value="">Select term</option>
        {terms.map((t) => (
          <option key={t.id} value={t.id}>{t.name} ({t.start_date})</option>
        ))}
      </select>

      <table className="min-w-full border text-xs">
        <thead>
          <tr>
            <th className="border p-2">Time</th>
            {dayNames.map((d) => <th key={d} className="border p-2">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot) => (
            <tr key={slot}>
              <td className="border p-2 whitespace-nowrap">{slot}</td>
              {dayNames.map((_, idx) => {
                const item = cell(slot, idx + 1);
                return (
                  <td key={idx} className="border p-2 align-top min-w-28">
                    {item ? (
                      <div>
                        <div className="font-semibold text-blue-800">{item.course_code}-{item.section_name}</div>
                        <div>{item.faculty_name || 'TBA'}</div>
                        <div>{item.classroom_name || 'No room'}</div>
                      </div>
                    ) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
