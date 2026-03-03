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
  years: {
    list: () => request('/academic/years'),
    create: (payload: unknown) => request('/academic/years', { method: 'POST', body: JSON.stringify(payload) }),
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
  },
};
