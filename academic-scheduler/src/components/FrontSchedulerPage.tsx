import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/db-client';
import './scheduler.css';
import { FacultyPanel, CoursePanel, StudentPanel, NoClassPanel, ConflictReschedulePanel } from './FeaturePanels';

type Year = { id: string; name: string };
type Program = { id: string; name: string; code: string; academic_year_id: string };
type Term = { id: string; name: string; term_number: number; academic_year_id: string; program_id: string; start_date?: string; end_date?: string };

type CourseCard = { id: string; code: string; name: string; section_name: string; students: number };
type Slot = { id: string; day_of_week: number; start_time: string; end_time: string; slot_name: string };
type Room = { id: string; name: string };
type Weekly = { day_of_week: number; start_time: string; end_time: string; course_code: string; section_name: string; classroom_name?: string; faculty_name?: string };
type Faculty = { id: string; name: string; department?: string };
type FacultyCalendarEvent = { class_date: string; course_code: string; section: string; class_number: number; time_slot: string; classroom_name?: string; status: string };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

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

  const [showFacultyCalendar, setShowFacultyCalendar] = useState(false);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [facultySearch, setFacultySearch] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [facultyCalendarEvents, setFacultyCalendarEvents] = useState<FacultyCalendarEvent[]>([]);

  const academicYearText = years.find((y) => y.id === yearId)?.name || '';
  const currentProgram = programs.find((p) => p.id === programId);
  const currentTerm = terms.find((t) => t.id === termId);

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

  const loadFacultyCalendar = async (facultyId: string, month: Date) => {
    if (!termId || !facultyId) return;
    const startDate = startOfMonth(month).toISOString().slice(0, 10);
    const endDate = endOfMonth(month).toISOString().slice(0, 10);
    const events = await api.scheduling.facultyCalendar(termId, facultyId, startDate, endDate);
    setFacultyCalendarEvents(events);
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

  useEffect(() => {
    if (showFacultyCalendar && programId && academicYearText) {
      api.faculty.list(programId, academicYearText).then((rows) => {
        setFacultyList(rows);
        if (!selectedFacultyId && rows[0]) setSelectedFacultyId(rows[0].id);
      }).catch(() => {});
    }
  }, [showFacultyCalendar, programId, academicYearText]);

  useEffect(() => {
    if (showFacultyCalendar && selectedFacultyId) {
      loadFacultyCalendar(selectedFacultyId, calendarMonth).catch(() => {});
    }
  }, [showFacultyCalendar, selectedFacultyId, termId, calendarMonth]);

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

  const onDropRoomSlot = async (dayName: string, time: string, roomId: string) => {
    if (!dragCardId || !termId || !programId || !academicYearText) return;
    const slot = slotFor(dayName, time);
    if (!slot) return;
    await api.scheduling.assign({
      term_id: termId,
      course_section_id: dragCardId,
      time_slot_id: slot.id,
      classroom_id: roomId,
      program_id: programId,
      academic_year: academicYearText,
    });
    setWeekly(await api.scheduling.weekly(termId));
  };

  const filteredFaculty = facultyList.filter((f) => f.name.toLowerCase().includes(facultySearch.toLowerCase()));
  const selectedFaculty = facultyList.find((f) => f.id === selectedFacultyId);

  const calendarCells = useMemo(() => {
    const first = startOfMonth(calendarMonth);
    const last = endOfMonth(calendarMonth);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;

    return Array.from({ length: total }, (_, idx) => {
      const dayNum = idx - offset + 1;
      if (dayNum < 1 || dayNum > daysInMonth) return null;
      const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNum);
      return d.toISOString().slice(0, 10);
    });
  }, [calendarMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, FacultyCalendarEvent[]>();
    for (const e of facultyCalendarEvents) {
      const arr = map.get(e.class_date) || [];
      arr.push(e);
      map.set(e.class_date, arr);
    }
    return map;
  }, [facultyCalendarEvents]);

  return (
    <>
      <header className="app-shell-header">
        <div className="brand-container">
          <div className="brand-title">📅 Academic Timetable Management</div>
          <div className="brand-subtitle">Developed by Prof. Jithesh A, IIM Raipur</div>
        </div>

        <div className="top-selectors">
          <label>Program:</label>
          <select id="progSel" className="form-select large" value={programId} onChange={(e) => setProgramId(e.target.value)}>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.code || p.name}</option>)}
          </select>
          <label>Year:</label>
          <select id="yearSel" className="form-select large" value={yearId} onChange={(e) => setYearId(e.target.value)}>
            {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
          <label>Term:</label>
          <select id="termSel" className="form-select large" value={termId} onChange={(e) => setTermId(e.target.value)}>
            {terms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </header>

      <section className="action-toolbar">
        <button className="btn btn-danger" onClick={clearGrid}>↻ Clear Schedule</button>
        <button className="btn btn-muted">🗓 Manage Terms</button>
        <button className="btn btn-success">⬇ Export Timetable</button>
        <button className="btn btn-green">📅 Calendar</button>
        <button className="btn btn-indigo" onClick={() => setShowFacultyCalendar(true)}>👥 Faculty</button>
        <button className="btn btn-indigo">🕘 Rescheduling History</button>
        <button className="btn btn-muted">⚙ Settings</button>
        <label className="btn btn-teal">📚 Import Courses<input type="file" hidden onChange={(e) => upload('courses', e.target.files?.[0])} /></label>
        <label className="btn btn-orange">📤 Import Students<input type="file" hidden onChange={(e) => upload('students', e.target.files?.[0])} /></label>
      </section>

      {uploadMessage && (
        <div className={`upload-banner ${uploadMessage.type}`}>
          {uploadMessage.text}
        </div>
      )}

      <div className="main-wrapper upgraded">
        <aside className="sidebar">
          <div className="sidebar-header">🎓 Course Sections</div>
          <div className="sidebar-subhead">{currentTerm?.name || 'Select Term'}</div>
          <div className="sidebar-meta">Program: {currentProgram?.code || '--'} · Year: {academicYearText || '--'}</div>
          <div style={{ padding: 10, borderBottom: '1px solid var(--gray-200)' }}>
            <input id="courseSearch" className="form-input" placeholder="Search courses or faculty..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div id="courseList" className="course-list">
            {filteredCards.map((c) => (
              <div key={c.id} className="course-card" draggable onDragStart={() => setDragCardId(c.id)}>
                <div className="course-code-line">{c.code}-{c.section_name}</div>
                <span className="prof-name">{c.name}</span>
                <div className="stats">👥 {c.students} students enrolled</div>
              </div>
            ))}
          </div>
        </aside>

        <main className="content">
          <div className="weekly-panel-title">📅 Weekly Schedule</div>
          <div id="timetable" className="upgraded-grid" style={{ gridTemplateColumns: `140px repeat(${timeHeaders.length}, 1fr)` }}>
            <div className="cell header-corner">Day</div>
            {timeHeaders.map((h) => <div key={h} className="cell header-cell upgraded">🕒 {h}</div>)}

            {DAYS.map((day) => (
              <div key={day} style={{ display: 'contents' }}>
                <div key={`${day}-d`} className="cell day-cell upgraded">📅 {day}</div>
                {timeHeaders.map((h) => {
                  const items = cellItems(day, h);
                  return (
                    <div key={`${day}-${h}`} className="cell slot-container upgraded">
                      {rooms.map((r) => (
                        <div key={r.id} className="room-slot upgraded" onDragOver={(e) => e.preventDefault()} onDrop={() => onDropRoomSlot(day, h, r.id)}>
                          <span className="room-label">🏫 {r.name}</span>
                          {items.filter((i) => !i.classroom_name || i.classroom_name === r.name).length === 0 ? (
                            <div className="empty-slot">Drop course here</div>
                          ) : (
                            items
                              .filter((i) => !i.classroom_name || i.classroom_name === r.name)
                              .map((m, idx) => (
                                <div key={idx} className="placed-course upgraded" title={`${m.course_code}-${m.section_name}`}>
                                  <div>{m.course_code}-{m.section_name}</div>
                                  <small>{m.classroom_name || r.name}</small>
                                </div>
                              ))
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="quick-add-row">
            <input className="form-input" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room" size={8} />
            <button className="btn btn-outline" onClick={addRoom}>+ Room</button>
            <input className="form-input" value={slotLabel} onChange={(e) => setSlotLabel(e.target.value)} placeholder="Time Slot" size={10} />
            <select className="form-select" value={slotDay} onChange={(e) => setSlotDay(Number(e.target.value))}>{DAYS.map((d, i) => <option key={d} value={i + 1}>{d.slice(0, 3)}</option>)}</select>
            <input className="form-input" type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
            <input className="form-input" type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
            <button className="btn btn-outline" onClick={addSlot}>+ Time</button>
          </div>
        </main>
      </div>

      {showFacultyCalendar && (
        <div className="modal-backdrop">
          <div className="modal-shell">
            <div className="modal-header">
              <h2>👤 Faculty Course Details</h2>
              <button className="close-btn" onClick={() => setShowFacultyCalendar(false)}>✕</button>
            </div>
            <div className="modal-body">
              <aside className="faculty-list-pane">
                <h3>Faculty List</h3>
                <input className="form-input" placeholder="Search faculty..." value={facultySearch} onChange={(e) => setFacultySearch(e.target.value)} />
                <div className="faculty-list-scroll">
                  {filteredFaculty.map((f) => (
                    <button key={f.id} className={`faculty-item ${selectedFacultyId === f.id ? 'active' : ''}`} onClick={() => setSelectedFacultyId(f.id)}>
                      <strong>{f.name}</strong>
                      <span>{f.department || 'Faculty'}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="faculty-calendar-pane">
                <div className="calendar-toolbar">
                  <button className="btn btn-outline" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>Previous</button>
                  <div className="calendar-title">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    <small>{selectedFaculty?.name || 'Select Faculty'} · {currentTerm?.name || 'No term selected'}</small>
                  </div>
                  <button className="btn btn-outline" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>Next</button>
                </div>

                <div className="month-grid">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="month-head">{d}</div>)}
                  {calendarCells.map((dateKey, idx) => {
                    if (!dateKey) return <div key={idx} className="month-cell empty" />;
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    return (
                      <div key={dateKey} className="month-cell">
                        <div className="day-num">{Number(dateKey.slice(-2))}</div>
                        {dayEvents.slice(0, 3).map((ev, i) => (
                          <div key={`${dateKey}-${i}`} className={`calendar-event ${ev.status}`}>
                            <strong>{ev.course_code}-{ev.section}</strong>
                            <span>#{ev.class_number} · {ev.time_slot}</span>
                            <span>{ev.classroom_name || '-'}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && <div className="more-events">+{dayEvents.length - 3} more</div>}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

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
