import React from 'react';
import { Home, Plus, Folder } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 px-6 py-2 flex justify-between items-center pb-safe">
      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-1 min-w-[4rem] ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <Home className={`w-6 h-6 ${isActive('/') ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">主页</span>
      </button>

      <button
        onClick={() => navigate('/create')}
        className="flex flex-col items-center gap-1 min-w-[4rem] text-gray-400 hover:text-gray-600"
      >
        <Plus className="w-6 h-6" />
        <span className="text-[10px] font-medium">创建</span>
      </button>

      <button
        onClick={() => navigate('/folders')}
        className={`flex flex-col items-center gap-1 min-w-[4rem] ${isActive('/folders') ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <Folder className={`w-6 h-6 ${isActive('/folders') ? 'fill-current' : ''}`} />
        <span className="text-[10px] font-medium">文件库</span>
      </button>
    </div>
  );
};