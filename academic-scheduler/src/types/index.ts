export type User = {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'faculty' | 'staff';
};

export type AcademicYear = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_archived: boolean;
};

export type Program = {
  id: string;
  name: string;
  code: string;
  academic_year_id: string;
};

export type Term = {
  id: string;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  academic_year_id: string;
  program_id: string;
};
