import LoginPage from './components/LoginPage';
import FrontSchedulerPage from './components/FrontSchedulerPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppBody() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <LoginPage />;
  return <FrontSchedulerPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppBody />
    </AuthProvider>
  );
}
