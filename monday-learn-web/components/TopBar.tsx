import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Bell, Settings, LogOut, Moon, Sun, Trophy, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { api } from '../utils/api';
import { UserResponse } from '../types';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        return saved === 'true';
      }
      // Auto dark mode between 7 PM (19:00) and 6 AM (06:00)
      const hour = new Date().getHours();
      if (hour >= 19 || hour < 6) {
        return true;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await api.get<UserResponse>('/auth/me');
        setUser(data);
        if (data?.role) {
          localStorage.setItem('userRole', data.role);
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchMe();
  }, []);

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/welcome');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-dark-blue md:border-b border-gray-200 dark:border-white/10 z-30 flex items-center px-4 justify-between transition-colors duration-200">
      <div className="flex items-center gap-4">
        {/* Logo Area */}
        <div className="cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/')}>
          <Logo />
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-4 hidden md:block">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all dark:bg-white/10 dark:border-white/10 dark:text-white dark:placeholder-gray-400"
            placeholder="搜索学习集、课本、问题..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/create')}
          className="hidden sm:flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 rounded-full">
          <Bell className="w-5 h-5" />
        </button>

        {/* Avatar Dropdown */}
        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-purple-500 transition-all overflow-hidden"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase() || 'U'
            )}
          </div>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-12 w-72 bg-white dark:bg-[#1a1b4b] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              {/* User Info Header */}
              <div className="p-4 border-b border-gray-50 dark:border-white/10 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{user?.username || 'User'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group">
                  <Trophy className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">成就</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group"
                >
                  <Settings className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">设置</span>
                </button>

                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">
                    {isDarkMode ? '浅色模式' : '深色模式'}
                  </span>
                </button>
              </div>

              <div className="border-t border-gray-50 dark:border-white/10 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group"
                >
                  <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400">退出</span>
                </button>
              </div>

              <div className="border-t border-gray-50 dark:border-white/10 py-2">
                <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">隐私政策</span>
                </button>
                <button className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white">帮助和反馈</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
};
