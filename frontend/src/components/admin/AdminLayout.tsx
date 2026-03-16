import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, MessageSquare, LogOut, Landmark, Building, FileText, Globe, ArrowLeftRight, Image, BarChart3, Images, UserCog, PenSquare, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/remitters', label: 'Remitters', icon: Building2, end: false },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare, end: false },
  { to: '/admin/banks', label: 'Banks', icon: Building, end: false },
  { to: '/admin/bank-rates', label: 'Bank Interest Rates', icon: Landmark, end: false },
  { to: '/admin/blogs', label: 'Blogs', icon: FileText, end: false },
  { to: '/admin/countries', label: 'Countries', icon: Globe, end: false },
  { to: '/admin/partner-routes', label: 'Partners', icon: ArrowLeftRight, end: false },
  { to: '/admin/banners', label: 'Banner Ads', icon: Image, end: false },
  { to: '/admin/exchange-chart', label: 'Exchange Chart', icon: BarChart3, end: false },
  { to: '/admin/gallery', label: 'Media Gallery', icon: Images, end: false },
  { to: '/admin/editors', label: 'Editors', icon: PenSquare, end: false },
  { to: '/admin/profile', label: 'My Profile', icon: UserCog, end: false },
];

const editorNavItems = [
  { to: '/admin/exchange-chart', label: 'Exchange Chart', icon: BarChart3, end: false },
  { to: '/admin/bank-rates', label: 'Bank Interest Rates', icon: Landmark, end: false },
  { to: '/admin/profile', label: 'My Profile', icon: UserCog, end: false },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isEditor = user?.role === 'editor';
  const navItems = isEditor ? editorNavItems : adminNavItems;
  const panelLabel = isEditor ? 'Editor Panel' : 'Admin Panel';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-gray-700">
          <span className="text-xl font-bold text-green-400">SajiloRemit</span>
          <p className="text-xs text-gray-400 mt-1">{panelLabel}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700 space-y-1">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          </div>
          <NavLink
            to="/"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
