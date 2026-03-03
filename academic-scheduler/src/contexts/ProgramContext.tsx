import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/db-client';
import type { Program } from '../types';

const Ctx = createContext<{ programs: Program[]; setAcademicYearId: (id: string) => void; reload: () => Promise<void> }>({
  programs: [],
  setAcademicYearId: () => {},
  reload: async () => {},
});

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');

  const reload = async () => {
    setPrograms(await api.programs.list(academicYearId || undefined));
  };

  useEffect(() => {
    reload().catch(() => {});
  }, [academicYearId]);

  return <Ctx.Provider value={{ programs, setAcademicYearId, reload }}>{children}</Ctx.Provider>;
}

export const usePrograms = () => useContext(Ctx);
