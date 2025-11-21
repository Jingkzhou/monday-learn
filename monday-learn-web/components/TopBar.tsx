
import React, { useEffect, useState } from 'react';
import { Search, Plus, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { api } from '../utils/api';
import { UserResponse } from '../types';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserResponse | null>(null);

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

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white md:border-b border-gray-200 z-30 flex items-center px-4 justify-between">
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
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

        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <Bell className="w-5 h-5" />
        </button>

        <div
          onClick={() => navigate('/profile')}
          className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-purple-500 transition-all overflow-hidden"
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            user?.username?.[0]?.toUpperCase() || 'U'
          )}
        </div>
      </div>
    </header>
  );
};
