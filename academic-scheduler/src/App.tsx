import Header from './components/Header';
import LoginPage from './components/LoginPage';
import StatsPanel from './components/StatsPanel';
import WeeklyGrid from './components/WeeklyGrid';
import SettingsPanel from './components/SettingsPanel';
import { AcademicYearProvider } from './contexts/AcademicYearContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProgramProvider } from './contexts/ProgramContext';

function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <LoginPage />;

  return (
    <AcademicYearProvider>
      <ProgramProvider>
        <div className="min-h-screen bg-slate-100">
          <Header />
          <div className="max-w-7xl mx-auto p-4 space-y-4">
            <StatsPanel />
            <WeeklyGrid />
          </div>
          <SettingsPanel />
        </div>
      </ProgramProvider>
    </AcademicYearProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
