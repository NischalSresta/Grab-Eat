import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UtensilsCrossed, ClipboardList, QrCode, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const StaffLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-1)' }}>GrabEat</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Staff Portal</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => navigate('/staff/orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isActive('/staff/orders')
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList size={15} />
              Orders
            </button>
            <button
              onClick={() => navigate('/staff/tables')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                isActive('/staff/tables')
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <QrCode size={15} />
              Tables
            </button>
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text-1)' }}>{user?.fullName}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition font-medium"
            >
              <LogOut size={15} /> Logout
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 px-4 py-3 space-y-1 bg-white">
            <div className="px-3 py-2 border-b border-gray-100 mb-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{user?.fullName}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{user?.role}</p>
            </div>
            <button
              onClick={() => { navigate('/staff/orders'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left ${
                isActive('/staff/orders')
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ClipboardList size={15} /> Orders
            </button>
            <button
              onClick={() => { navigate('/staff/tables'); setMenuOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left ${
                isActive('/staff/tables')
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <QrCode size={15} /> Table QR
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 font-semibold hover:bg-red-50 rounded-xl transition text-left"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default StaffLayout;
