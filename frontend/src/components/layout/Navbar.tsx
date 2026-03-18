import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, User, LogOut, LayoutDashboard, UserCog, MessageSquare } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/best-rates', label: 'Best Rate' },
    { to: '/forex', label: 'Forex' },
    { to: '/remitters', label: 'Remitters' },
    { to: '/contact', label: 'Contact Us' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="SajiloRemit" className="h-16 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-green-600 font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-1 text-gray-600 hover:text-green-600"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.name}</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {(user.role === 'admin' || user.role === 'editor') && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    )}
                    {user.role === 'remitter' && (
                      <Link
                        to="/remitter/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    )}
                    {user.role === 'user' && (
                      <Link
                        to="/my-reviews"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600"
                        onClick={() => setProfileOpen(false)}
                      >
                        <MessageSquare className="w-4 h-4" />
                        My Reviews
                      </Link>
                    )}
                    <Link
                      to={user.role === 'admin' || user.role === 'editor' ? '/admin/profile' : '/profile'}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserCog className="w-4 h-4" />
                      Manage Profile
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { setProfileOpen(false); handleLogout(); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-green-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/join-us"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  Become a Remitter
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user ? (
              <div className="pt-2 space-y-2 border-t">
                <Link to="/login" className="block px-3 py-2 text-gray-600" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-green-600 text-white rounded-lg text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Become a Remitter
                </Link>
              </div>
            ) : (
              <div className="pt-2 space-y-1 border-t">
                {(user.role === 'admin' || user.role === 'editor') && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {user.role === 'remitter' && (
                  <Link
                    to="/remitter/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {user.role === 'user' && (
                  <Link
                    to="/my-reviews"
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg"
                    onClick={() => setMobileOpen(false)}
                  >
                    <MessageSquare className="w-4 h-4" />
                    My Reviews
                  </Link>
                )}
                <Link
                  to={user.role === 'admin' || user.role === 'editor' ? '/admin/profile' : '/profile'}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-green-50 hover:text-green-600 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserCog className="w-4 h-4" />
                  Manage Profile
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
