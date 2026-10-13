import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, FileText, PlusCircle, Users, User, Shield,
  Bell, Menu, X, Search, ChevronLeft,
  AlertTriangle, Star, LogIn, LogOut, Database
} from 'lucide-react';
import { useApp } from '../context';
import { AuthModal } from './AuthModal';

const navItems = [
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/reports', label: 'البلاغات', icon: FileText },
  { path: '/reports/new', label: 'بلاغ جديد', icon: PlusCircle },
  { path: '/volunteers', label: 'المتطوعين', icon: Users },
  { path: '/profile', label: 'الملف الشخصي', icon: User },
  { path: '/admin', label: 'لوحة التحكم', icon: Shield },
];

export function Header({ onOpenAuth }: { onOpenAuth: () => void }) {
  const navigate = useNavigate();
  const { currentUser, notifications, sidebarOpen, setSidebarOpen, markNotificationRead, serverStatus, logout } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/reports?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
    }
  };
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = () => {
      setShowNotifications(false);
      setShowUserMenu(false);
    };
    if (showNotifications || showUserMenu) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [showNotifications, showUserMenu]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <span className="text-white font-bold text-lg">إ</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-emerald-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>إصلاح</h1>
              <p className="text-[10px] text-gray-400 -mt-1">منصة خدمة المجتمع</p>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن بلاغ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Server / Database status pill */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                serverStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                serverStatus === 'connected'
                  ? 'خادم Express وقاعدة بيانات PostgreSQL متصلة'
                  : 'الخادم غير متصل حالياً. البيانات والتغييرات غير متاحة.'
              }
            >
              <Database className="w-3.5 h-3.5" />
              <span>{serverStatus === 'connected' ? 'PostgreSQL متصل' : 'الخادم غير متصل'}</span>
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="md:hidden p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded-lg"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Emergency Button */}
            <Link
              to="/reports/new?priority=urgent"
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              طوارئ
            </Link>

            {/* Notifications */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-800">الإشعارات</h3>
                    <span className="text-xs text-emerald-600 font-medium">{unreadCount} جديد</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.read ? 'bg-emerald-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg mt-0.5">
                            {notif.type === 'success' ? '✅' : notif.type === 'warning' ? '⚠️' : notif.type === 'error' ? '❌' : 'ℹ️'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          </div>
                          {!notif.read && <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2 shrink-0" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth / User Profile Menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm shadow-inner">
                  {currentUser.avatar}
                </div>
                <span className="text-sm font-semibold text-gray-700 hidden sm:block">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-800 truncate">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                      {currentUser.role === 'admin' ? '🛡️ مدير' : currentUser.role === 'volunteer' ? '👩 متطوع' : '👤 مواطن'}
                    </span>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    الملف الشخصي
                  </Link>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-right"
                  >
                    <LogIn className="w-4 h-4 text-blue-600" />
                    تسجيل الدخول / تبديل الحساب
                  </button>

                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-right"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-emerald-600 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث عن بلاغ..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

export function Sidebar({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { sidebarOpen, setSidebarOpen, currentUser } = useApp();
  const location = useLocation();

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-16 right-0 bottom-0 w-72 bg-white border-l border-gray-200 z-40 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:top-16 lg:z-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* User Card */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-xl shadow-sm">
                {currentUser.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500">
                  {currentUser.role === 'volunteer' ? 'متطوع' : currentUser.role === 'organization' ? 'مؤسسة' : currentUser.role === 'admin' ? 'مدير منصة' : 'مواطن'}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">{currentUser.points} نقطة</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenAuth}
              className="w-full mt-3 py-1.5 px-3 bg-gray-50 hover:bg-emerald-50 text-emerald-700 border border-gray-200 hover:border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول / تبديل الحساب</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm font-bold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : ''}`} />
                  {item.label}
                  {isActive && <ChevronLeft className="w-4 h-4 mr-auto text-emerald-500" />}
                </Link>
              );
            })}
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-blue-700">{currentUser.reportsCount}</p>
                <p className="text-[10px] text-blue-500">بلاغاتي</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-emerald-700">{currentUser.resolvedCount}</p>
                <p className="text-[10px] text-emerald-500">تم حلها</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ fontFamily: 'Tajawal, sans-serif' }}>
      <Header onOpenAuth={() => setAuthModalOpen(true)} />
      <div className="flex flex-1">
        <Sidebar onOpenAuth={() => setAuthModalOpen(true)} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
