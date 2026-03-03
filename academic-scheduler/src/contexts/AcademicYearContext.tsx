import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/db-client';
import type { AcademicYear } from '../types';

const Ctx = createContext<{ years: AcademicYear[]; reload: () => Promise<void> }>({ years: [], reload: async () => {} });

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const reload = async () => setYears(await api.years.list());
  useEffect(() => {
    reload().catch(() => {});
  }, []);
  return <Ctx.Provider value={{ years, reload }}>{children}</Ctx.Provider>;
}

export const useAcademicYears = () => useContext(Ctx);
