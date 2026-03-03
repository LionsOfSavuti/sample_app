import { FormEvent, useState } from 'react';
import { api } from '../lib/db-client';

export default function CsvImportPanel() {
  const [programId, setProgramId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [coursesCsv, setCoursesCsv] = useState('code,name,credits,term,section\nCS101,Intro to Programming,1,1,A');
  const [studentsCsv, setStudentsCsv] = useState('student_id,name,email,section\nS001,Jane Doe,jane@example.com,A');
  const [msg, setMsg] = useState('');

  const submit = async (e: FormEvent, type: 'courses' | 'students') => {
    e.preventDefault();
    const out = type === 'courses'
      ? await api.imports.courses({ csv: coursesCsv, program_id: programId, academic_year: academicYear })
      : await api.imports.students({ csv: studentsCsv, program_id: programId, academic_year: academicYear });
    setMsg(`${type} import: ${out.inserted}/${out.total}`);
  };

  return (
    <section className="bg-white p-4 rounded shadow mt-4">
      <h2 className="font-semibold mb-2">CSV Import (Courses & Students)</h2>
      <div className="grid md:grid-cols-2 gap-2 mb-3">
        <input className="border p-2" placeholder="program_id (UUID)" value={programId} onChange={(e) => setProgramId(e.target.value)} />
        <input className="border p-2" placeholder="academic_year text (e.g. 2024-2025)" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
      </div>

      <form onSubmit={(e) => submit(e, 'courses')} className="space-y-2 mb-4">
        <label className="text-sm font-medium">Courses CSV</label>
        <textarea className="border p-2 w-full min-h-24" value={coursesCsv} onChange={(e) => setCoursesCsv(e.target.value)} />
        <button className="bg-blue-700 text-white px-3 py-1 rounded">Import Courses</button>
      </form>

      <form onSubmit={(e) => submit(e, 'students')} className="space-y-2">
        <label className="text-sm font-medium">Students CSV</label>
        <textarea className="border p-2 w-full min-h-24" value={studentsCsv} onChange={(e) => setStudentsCsv(e.target.value)} />
        <button className="bg-blue-700 text-white px-3 py-1 rounded">Import Students</button>
      </form>

      {msg && <p className="text-green-700 text-sm mt-2">{msg}</p>}
    </section>
  );
}
