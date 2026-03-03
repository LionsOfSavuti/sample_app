import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/db-client';
import './scheduler.css';
import { FacultyPanel, CoursePanel, StudentPanel, NoClassPanel, ConflictReschedulePanel } from './FeaturePanels';

type Year = { id: string; name: string };
type Program = { id: string; name: string; code: string; academic_year_id: string };
type Term = { id: string; name: string; term_number: number; academic_year_id: string; program_id: string };

type CourseCard = { id: string; code: string; name: string; section_name: string; students: number };
type Slot = { id: string; day_of_week: number; start_time: string; end_time: string; slot_name: string };
type Room = { id: string; name: string };
type Weekly = { day_of_week: number; start_time: string; end_time: string; course_code: string; section_name: string; classroom_name?: string; faculty_name?: string };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function FrontSchedulerPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  const [yearId, setYearId] = useState('');
  const [programId, setProgramId] = useState('');
  const [termId, setTermId] = useState('');

  const [rooms, setRooms] = useState<Room[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [cards, setCards] = useState<CourseCard[]>([]);
  const [weekly, setWeekly] = useState<Weekly[]>([]);

  const [roomName, setRoomName] = useState('');
  const [slotLabel, setSlotLabel] = useState('');
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('10:30');
  const [slotDay, setSlotDay] = useState(1);
  const [search, setSearch] = useState('');
  const [dragCardId, setDragCardId] = useState('');
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const academicYearText = years.find((y) => y.id === yearId)?.name || '';

  const loadMeta = async () => {
    const ys = await api.years.list();
    setYears(ys.map((y: any) => ({ id: y.id, name: y.name })));
    if (!yearId && ys[0]) setYearId(ys[0].id);
  };

  const loadPrograms = async () => {
    if (!yearId) return;
    const ps = await api.programs.list(yearId);
    setPrograms(ps);
    if (!programId && ps[0]) setProgramId(ps[0].id);
  };

  const loadTerms = async () => {
    if (!programId) return;
    const ts = await api.terms.list(programId);
    setTerms(ts);
    if (!termId && ts[0]) setTermId(ts[0].id);
  };

  const refreshData = async () => {
    if (!programId || !academicYearText) return;
    const [s, c, r] = await Promise.all([
      api.timeSlots.list(programId, academicYearText),
      api.courseSections.list(programId, academicYearText),
      api.classrooms.list(programId, academicYearText),
    ]);
    setSlots(s);
    setRooms(r.map((x: any) => ({ id: x.id, name: x.name })));
    setCards(c);

    if (termId) {
      const w = await api.scheduling.weekly(termId);
      setWeekly(w);
    }
  };

  useEffect(() => {
    loadMeta().catch(() => {});
  }, []);

  useEffect(() => {
    setProgramId('');
    setTermId('');
    loadPrograms().catch(() => {});
  }, [yearId]);

  useEffect(() => {
    setTermId('');
    loadTerms().catch(() => {});
  }, [programId]);

  useEffect(() => {
    refreshData().catch(() => {});
  }, [programId, termId, academicYearText]);

  const addRoom = async () => {
    if (!roomName || !programId || !academicYearText) return;
    await api.classrooms.create({ name: roomName, program_id: programId, academic_year: academicYearText });
    setRoomName('');
    await refreshData();
  };

  const addSlot = async () => {
    if (!slotLabel || !programId || !academicYearText) return;
    await api.timeSlots.create({
      day_of_week: slotDay,
      start_time: slotStart,
      end_time: slotEnd,
      slot_name: slotLabel,
      program_id: programId,
      academic_year: academicYearText,
    });
    setSlotLabel('');
    await refreshData();
  };

  const clearGrid = async () => {
    if (!termId) return;
    await fetch(`/api/scheduling/clear/${termId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
    await refreshData();
  };

  const upload = async (type: 'students' | 'courses', file?: File) => {
    if (!file || !programId || !academicYearText) {
      alert('Select year/program first before uploading CSV.');
      return;
    }

    const text = await file.text();
    try {
      const out = type === 'students'
        ? await api.imports.students({ csv: text, program_id: programId, academic_year: academicYearText })
        : await api.imports.courses({ csv: text, program_id: programId, academic_year: academicYearText });

      const base = out.message || `${type} upload completed`;
      const details = `inserted ${out.inserted ?? 0}/${out.total ?? 0}, skipped ${out.skipped ?? 0}`;
      const errors = Array.isArray(out.row_errors) && out.row_errors.length
        ? ` | Row issues: ${out.row_errors.slice(0, 3).map((e: any) => `#${e.row} ${e.reason}`).join('; ')}`
        : '';

      setUploadMessage({ type: 'success', text: `${base} (${details})${errors}` });
      await refreshData();
    } catch (error: any) {
      setUploadMessage({ type: 'error', text: error?.message || 'Upload failed' });
    }
  };

  const filteredCards = cards.filter((c) => c.students >= 15 && (`${c.code} ${c.name}`.toLowerCase().includes(search.toLowerCase())));
  const timeHeaders = useMemo(() => Array.from(new Set(slots.map((s) => `${s.start_time}-${s.end_time}`))), [slots]);

  const slotFor = (dayName: string, time: string) => {
    const day = DAYS.indexOf(dayName) + 1;
    const [start, end] = time.split('-');
    return slots.find((s) => s.day_of_week === day && s.start_time === start && s.end_time === end);
  };

  const cellItems = (dayName: string, time: string) => {
    const day = DAYS.indexOf(dayName) + 1;
    const [start, end] = time.split('-');
    return weekly.filter((w) => w.day_of_week === day && w.start_time === start && w.end_time === end);
  };

  const onDropCell = async (dayName: string, time: string) => {
    if (!dragCardId || !termId || !programId || !academicYearText) return;
    const slot = slotFor(dayName, time);
    if (!slot) return;
    await api.scheduling.assign({
      term_id: termId,
      course_section_id: dragCardId,
      time_slot_id: slot.id,
      classroom_id: rooms[0]?.id || null,
      program_id: programId,
      academic_year: academicYearText,
    });
    setWeekly(await api.scheduling.weekly(termId));
  };

  return (
    <>
      <header className="app-header">
        <div className="brand-container">
          <div className="brand-title">📅 IIM Raipur Timetable Scheduler</div>
          <div className="brand-subtitle">Developed by Dr Jithesh A</div>
        </div>

        <div className="header-controls">
          <select id="yearSel" className="form-select" value={yearId} onChange={(e) => setYearId(e.target.value)}>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <select id="progSel" className="form-select" value={programId} onChange={(e) => setProgramId(e.target.value)}>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.code || p.name}</option>)}
          </select>
          <select id="termSel" className="form-select" value={termId} onChange={(e) => setTermId(e.target.value)}>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="header-controls">
          <input className="form-input" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room" size={8} />
          <button className="btn btn-outline" onClick={addRoom}>+ Room</button>
          <input className="form-input" value={slotLabel} onChange={(e) => setSlotLabel(e.target.value)} placeholder="Time Slot" size={10} />
          <select className="form-select" value={slotDay} onChange={(e) => setSlotDay(Number(e.target.value))}>{DAYS.map((d, i) => <option key={d} value={i + 1}>{d.slice(0,3)}</option>)}</select>
          <input className="form-input" type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
          <input className="form-input" type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
          <button className="btn btn-outline" onClick={addSlot}>+ Time</button>
        </div>

        <div className="header-controls">
          <label className="btn btn-primary">Students<input type="file" hidden onChange={(e) => upload('students', e.target.files?.[0])} /></label>
          <label className="btn btn-primary">Courses<input type="file" hidden onChange={(e) => upload('courses', e.target.files?.[0])} /></label>
          <button className="btn btn-danger" onClick={clearGrid}>Reset</button>
        </div>
      </header>

      {uploadMessage && (
        <div
          style={{
            margin: '8px 24px 0',
            padding: '10px 12px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            background: uploadMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: uploadMessage.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {uploadMessage.text}
        </div>
      )}

      <div className="main-wrapper">
        <aside className="sidebar">
          <div className="sidebar-header">Courses (Min 15 Students)</div>
          <div style={{ padding: 10, borderBottom: '1px solid var(--gray-200)' }}>
            <input id="courseSearch" className="form-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div id="courseList" className="course-list">
            {filteredCards.map((c) => (
              <div key={c.id} className="course-card" draggable onDragStart={() => setDragCardId(c.id)}>
                <div className="course-code-line">{c.code.slice(-3).toUpperCase()}<br />{c.section_name}</div>
                <span className="prof-name">{c.name}</span>
                <div className="stats">Sessions scheduled: --<br />No of students enrolled: {c.students}</div>
              </div>
            ))}
          </div>
        </aside>

        <main className="content">
          <div id="timetable" style={{ gridTemplateColumns: `40px repeat(${timeHeaders.length}, 1fr)` }}>
            <div className="cell" style={{ background: 'var(--gray-900)' }} />
            {timeHeaders.map((h) => <div key={h} className="cell header-cell">{h}</div>)}

            {DAYS.map((day) => (
              <div key={day} style={{display:'contents'}}>
                <div key={`${day}-d`} className="cell day-cell">{day}</div>
                {timeHeaders.map((h) => {
                  const items = cellItems(day, h);
                  return (
                    <div key={`${day}-${h}`} className="cell slot-container" onDragOver={(e) => e.preventDefault()} onDrop={() => onDropCell(day, h)}>
                      {rooms.map((r) => (
                        <div key={r.id} className="room-slot">
                          <span className="room-label">{r.name}</span>
                          <div className="clash-badge" />
                          {items.filter((i) => !i.classroom_name || i.classroom_name === r.name).map((m, idx) => (
                            <div key={idx} className="placed-course" title={`${m.course_code}-${m.section_name}`}>
                              {m.course_code.slice(-3).toUpperCase()} - {m.section_name}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </main>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <FacultyPanel />
        <CoursePanel />
        <StudentPanel />
        <NoClassPanel />
        <ConflictReschedulePanel />
      </div>
    </>
  );
}
