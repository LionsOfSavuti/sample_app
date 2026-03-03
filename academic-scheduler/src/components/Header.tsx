import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-blue-800 text-white px-4 py-3 flex justify-between items-center">
      <h1 className="font-semibold">Academic Scheduler</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm">{user?.username} ({user?.role})</span>
        <button className="bg-blue-600 px-3 py-1 rounded" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
