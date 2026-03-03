import { FormEvent, useState } from 'react';
import { api } from '../lib/db-client';

export function FacultyPanel() {
  const [programId, setProgramId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    if (!programId || !academicYear) return;
    setRows(await api.faculty.list(programId, academicYear));
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await api.faculty.create({ name, email, department, program_id: programId, academic_year: academicYear });
    setName(''); setEmail(''); setDepartment('');
    await load();
  };

  return <section className="bg-white p-4 rounded shadow mt-4"><h3 className="font-semibold">Faculty</h3>
    <div className="grid grid-cols-2 gap-2 my-2"><input className="border p-2" placeholder="program_id" value={programId} onChange={e=>setProgramId(e.target.value)}/><input className="border p-2" placeholder="academic_year" value={academicYear} onChange={e=>setAcademicYear(e.target.value)}/></div>
    <button className="text-blue-700" onClick={load}>Load</button>
    <form onSubmit={create} className="grid md:grid-cols-4 gap-2 mt-2"><input className="border p-2" placeholder="name" value={name} onChange={e=>setName(e.target.value)}/><input className="border p-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)}/><input className="border p-2" placeholder="department" value={department} onChange={e=>setDepartment(e.target.value)}/><button className="bg-blue-700 text-white rounded">Add</button></form>
    <ul className="text-sm mt-2">{rows.map(r=><li key={r.id}>{r.name} ({r.department || '-'})</li>)}</ul>
  </section>;
}

export function CoursePanel() {
  const [programId, setProgramId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState('1');
  const [term, setTerm] = useState('1');
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => { if (!programId || !academicYear) return; setRows(await api.courses.list(programId, academicYear)); };
  const create = async (e: FormEvent) => { e.preventDefault(); await api.courses.create({ name, code, credits: Number(credits), term: Number(term), program_id: programId, academic_year: academicYear }); setName(''); setCode(''); await load(); };
  return <section className="bg-white p-4 rounded shadow mt-4"><h3 className="font-semibold">Courses</h3>
    <div className="grid grid-cols-2 gap-2 my-2"><input className="border p-2" placeholder="program_id" value={programId} onChange={e=>setProgramId(e.target.value)}/><input className="border p-2" placeholder="academic_year" value={academicYear} onChange={e=>setAcademicYear(e.target.value)}/></div>
    <button className="text-blue-700" onClick={load}>Load</button>
    <form onSubmit={create} className="grid md:grid-cols-5 gap-2 mt-2"><input className="border p-2" placeholder="name" value={name} onChange={e=>setName(e.target.value)}/><input className="border p-2" placeholder="code" value={code} onChange={e=>setCode(e.target.value)}/><input className="border p-2" placeholder="credits" value={credits} onChange={e=>setCredits(e.target.value)}/><select className="border p-2" value={term} onChange={e=>setTerm(e.target.value)}><option value="1">1</option><option value="2">2</option><option value="3">3</option></select><button className="bg-blue-700 text-white rounded">Add</button></form>
    <ul className="text-sm mt-2">{rows.map(r=><li key={r.id}>{r.code} - {r.name} (T{r.term})</li>)}</ul>
  </section>;
}

export function StudentPanel() {
  const [programId, setProgramId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [section, setSection] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => { if (!programId || !academicYear) return; setRows(await api.students.list(programId, academicYear)); };
  const create = async (e: FormEvent) => { e.preventDefault(); await api.students.create({ student_id: studentId, name, email, section, program_id: programId, academic_year: academicYear }); setStudentId(''); setName(''); setEmail(''); setSection(''); await load(); };
  return <section className="bg-white p-4 rounded shadow mt-4"><h3 className="font-semibold">Students</h3>
    <div className="grid grid-cols-2 gap-2 my-2"><input className="border p-2" placeholder="program_id" value={programId} onChange={e=>setProgramId(e.target.value)}/><input className="border p-2" placeholder="academic_year" value={academicYear} onChange={e=>setAcademicYear(e.target.value)}/></div>
    <button className="text-blue-700" onClick={load}>Load</button>
    <form onSubmit={create} className="grid md:grid-cols-5 gap-2 mt-2"><input className="border p-2" placeholder="student_id" value={studentId} onChange={e=>setStudentId(e.target.value)}/><input className="border p-2" placeholder="name" value={name} onChange={e=>setName(e.target.value)}/><input className="border p-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)}/><input className="border p-2" placeholder="section" value={section} onChange={e=>setSection(e.target.value)}/><button className="bg-blue-700 text-white rounded">Add</button></form>
    <ul className="text-sm mt-2">{rows.map(r=><li key={r.id}>{r.student_id} - {r.name}</li>)}</ul>
  </section>;
}

export function NoClassPanel() {
  const [termId, setTermId] = useState('');
  const [programId, setProgramId] = useState('');
  const [activity, setActivity] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => { if (!termId) return; setRows(await api.noClass.list(termId)); };
  const create = async (e: FormEvent) => { e.preventDefault(); await api.noClass.create({ term_id: termId, program_id: programId, activity_name: activity, start_date: start, end_date: end }); setActivity(''); setStart(''); setEnd(''); await load(); };
  return <section className="bg-white p-4 rounded shadow mt-4"><h3 className="font-semibold">No-Class Periods</h3>
    <div className="grid grid-cols-2 gap-2 my-2"><input className="border p-2" placeholder="term_id" value={termId} onChange={e=>setTermId(e.target.value)}/><input className="border p-2" placeholder="program_id" value={programId} onChange={e=>setProgramId(e.target.value)}/></div>
    <button className="text-blue-700" onClick={load}>Load</button>
    <form onSubmit={create} className="grid md:grid-cols-4 gap-2 mt-2"><input className="border p-2" placeholder="activity" value={activity} onChange={e=>setActivity(e.target.value)}/><input className="border p-2" type="date" value={start} onChange={e=>setStart(e.target.value)}/><input className="border p-2" type="date" value={end} onChange={e=>setEnd(e.target.value)}/><button className="bg-blue-700 text-white rounded">Add</button></form>
    <ul className="text-sm mt-2">{rows.map(r=><li key={r.id}>{r.activity_name}: {r.start_date} - {r.end_date}</li>)}</ul>
  </section>;
}

export function ConflictReschedulePanel() {
  const [termId, setTermId] = useState('');
  const [conflicts, setConflicts] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [form, setForm] = useState({ term_id: '', course_id: '', section: '', original_date: '', original_class_number: '', new_date: '', new_class_number: '', reason: '', program_id: '', academic_year: '' });

  const load = async () => {
    if (!termId) return;
    setConflicts(await api.scheduling.conflicts(termId));
    setHistory(await api.scheduling.history(termId));
  };

  const reschedule = async (e: FormEvent) => {
    e.preventDefault();
    await api.scheduling.reschedule({ ...form, original_class_number: Number(form.original_class_number), new_class_number: Number(form.new_class_number) });
    await load();
  };

  return <section className="bg-white p-4 rounded shadow mt-4"><h3 className="font-semibold">Conflicts & Rescheduling</h3>
    <div className="flex gap-2 my-2"><input className="border p-2" placeholder="term_id" value={termId} onChange={e=>setTermId(e.target.value)}/><button className="text-blue-700" onClick={load}>Load</button></div>
    {conflicts && <div className="text-sm"><div>Faculty conflicts: {conflicts.facultyConflicts?.length || 0}</div><div>Room conflicts: {conflicts.roomConflicts?.length || 0}</div></div>}
    <form onSubmit={reschedule} className="grid md:grid-cols-3 gap-2 mt-3">
      {Object.keys(form).map((k)=> <input key={k} className="border p-2" placeholder={k} value={(form as any)[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>)}
      <button className="bg-blue-700 text-white rounded p-2">Reschedule</button>
    </form>
    <ul className="text-xs mt-2">{history.map(h => <li key={h.id}>{h.section}: {h.original_date} → {h.new_date}</li>)}</ul>
  </section>;
}
