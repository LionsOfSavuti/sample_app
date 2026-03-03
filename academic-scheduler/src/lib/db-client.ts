const API_URL = '/api';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const request = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(init.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
};

export const api = {
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  years: {
    list: () => request('/academic/years'),
    create: (payload: unknown) => request('/academic/years', { method: 'POST', body: JSON.stringify(payload) }),
    setCurrent: (id: string) => request(`/academic/years/${id}/set-current`, { method: 'POST' }),
    archive: (id: string) => request(`/academic/years/${id}/archive`, { method: 'POST' }),
    restore: (id: string) => request(`/academic/years/${id}/restore`, { method: 'POST' }),
  },
  programs: {
    list: (academicYearId?: string) => request(`/academic/programs${academicYearId ? `?academic_year_id=${academicYearId}` : ''}`),
    create: (payload: unknown) => request('/academic/programs', { method: 'POST', body: JSON.stringify(payload) }),
  },
  terms: {
    list: (programId?: string) => request(`/academic/terms${programId ? `?program_id=${programId}` : ''}`),
    create: (payload: unknown) => request('/academic/terms', { method: 'POST', body: JSON.stringify(payload) }),
  },
  scheduling: {
    generate: (termId: string) => request(`/scheduling/generate/${termId}`, { method: 'POST' }),
    weekly: (termId: string) => request(`/scheduling/weekly?term_id=${termId}`),
    assign: (payload: unknown) => request('/scheduling/assign', { method: 'POST', body: JSON.stringify(payload) }),
  },
  invitations: {
    list: () => request('/invitations'),
    create: (payload: unknown) => request('/invitations', { method: 'POST', body: JSON.stringify(payload) }),
    resend: (id: string) => request(`/invitations/${id}/resend`, { method: 'POST' }),
    accept: (payload: unknown) => request('/invitations/accept', { method: 'POST', body: JSON.stringify(payload) }),
  },
  stats: {
    overview: (programId?: string) => request(`/stats/overview${programId ? `?program_id=${programId}` : ''}`),
  },
  imports: {
    courses: (payload: unknown) => request('/academic/import/courses', { method: 'POST', body: JSON.stringify(payload) }),
    students: (payload: unknown) => request('/academic/import/students', { method: 'POST', body: JSON.stringify(payload) }),
  },
  timeSlots: {
    list: (programId: string, academicYear: string) => request(`/academic/time-slots?program_id=${programId}&academic_year=${encodeURIComponent(academicYear)}`),
    create: (payload: unknown) => request('/academic/time-slots', { method: 'POST', body: JSON.stringify(payload) }),
  },
  courseSections: {
    list: (programId: string, academicYear: string) => request(`/academic/course-sections?program_id=${programId}&academic_year=${encodeURIComponent(academicYear)}`),
  },
  classrooms: {
    list: (programId: string, academicYear: string) => request(`/academic/classrooms?program_id=${programId}&academic_year=${encodeURIComponent(academicYear)}`),
  },
};
