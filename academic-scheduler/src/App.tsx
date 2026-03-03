import Header from './components/Header';
import LoginPage from './components/LoginPage';
import TermAndGenerationPanel from './components/TermAndGenerationPanel';
import YearProgramPanel from './components/YearProgramPanel';
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
          <div className="max-w-6xl mx-auto p-4 space-y-4">
            <YearProgramPanel />
            <TermAndGenerationPanel />
          </div>
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
