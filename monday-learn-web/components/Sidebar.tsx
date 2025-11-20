import React from 'react';
import { Home, Folder, PlusSquare, Library, Settings } from 'lucide-react';
import { NavItem } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS: NavItem[] = [
  { label: '首页', icon: Home, path: '/' },
  { label: '你的文库', icon: Library, path: '/library' },
  { label: '文件夹', icon: Folder, path: '/folders' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 hidden md:flex flex-col z-20">
      <div className="p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                isActive 
                  ? 'bg-indigo-50 text-primary' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-gray-100">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          你的班级
        </div>
        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
          <PlusSquare className="w-4 h-4 mr-3" />
          加入班级
        </button>
      </div>
    </aside>
  );
};