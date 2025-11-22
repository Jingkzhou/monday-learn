import React, { useEffect, useState } from 'react';
import { Home, Folder, PlusSquare, Library, Settings, Calendar, BarChart2 } from 'lucide-react';
import { NavItem, UserRole, UserResponse } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';

const NAV_ITEMS: NavItem[] = [
  { label: '首页', icon: Home, path: '/' },
  { label: '你的文库', icon: Library, path: '/library' },
  { label: '文件夹', icon: Folder, path: '/folders' },
  { label: '分析', icon: BarChart2, path: '/analysis' },
  { label: '管理', icon: Settings, path: '/admin', roles: ['admin'] },
  { label: '日历', icon: Calendar, path: '/calendar' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<UserRole | null>(() => (localStorage.getItem('userRole') as UserRole | null) || null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.get<UserResponse>('/auth/me');
        if (data?.role) {
          setRole(data.role);
          localStorage.setItem('userRole', data.role);
        }
      } catch (err) {
        console.error('Failed to fetch user for nav', err);
      }
    };
    fetchUser();
  }, []);

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-dark-blue border-r border-gray-200 dark:border-white/10 hidden md:flex flex-col z-20 transition-colors duration-200">
      <div className="p-4 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                ? 'bg-indigo-50 dark:bg-white/10 text-primary dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary dark:text-white' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-gray-100 dark:border-white/10">
        <div
          className="flex items-center justify-between px-4 py-2 mb-1 cursor-pointer group hover:bg-gray-50 dark:hover:bg-white/5 rounded-md transition-all"
          onClick={() => navigate('/classes')}
        >
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider group-hover:text-primary dark:group-hover:text-white transition-colors">你的班级</span>
          <span className="text-[10px] font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity group-hover:text-primary dark:group-hover:text-white">管理</span>
        </div>

      </div>
    </aside>
  );
};
