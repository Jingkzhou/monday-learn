import React from 'react';

export const CalendarPage: React.FC = () => {
  return (
    <div className="pt-20 pb-10 px-4 md:px-8 max-w-7xl mx-auto ml-0 md:ml-64">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">日历</h1>
        <p className="text-gray-600">这里将展示您的学习计划与安排。</p>
      </div>
    </div>
  );
};
