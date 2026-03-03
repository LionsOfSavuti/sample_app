import { useEffect, useState } from 'react';
import { api } from '../lib/db-client';

type Stats = { faculty: number; courses: number; students: number; scheduledClasses: number };

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.stats.overview().then(setStats).catch(() => {});
  }, []);

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        ['Faculty', stats?.faculty ?? 0],
        ['Courses', stats?.courses ?? 0],
        ['Students', stats?.students ?? 0],
        ['Scheduled Classes', stats?.scheduledClasses ?? 0],
      ].map(([label, value]) => (
        <div key={String(label)} className="bg-white p-4 rounded shadow">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-blue-800">{value}</p>
        </div>
      ))}
    </section>
  );
}
