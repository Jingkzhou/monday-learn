import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, BookOpen, CheckCircle, AlertCircle, Trophy } from 'lucide-react';
import { api } from '../utils/api';

interface DailySummary {
  date: string;
  count: number; // 0-4
  total_time_ms: number;
  total_words: number;
}

interface DailyDetailItem {
  id: number;
  time: string;
  action: string;
  mode: string;
  details: string;
}

interface DailyDetailResponse {
  date: string;
  total_time_ms: number;
  items: DailyDetailItem[];
  mastered_count: number;
}

export function CalendarPage() {
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyDetail, setDailyDetail] = useState<DailyDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyDetail(selectedDate);
    } else {
      setDailyDetail(null);
    }
  }, [selectedDate]);

  const fetchMonthlyData = async () => {
    try {
      // Fetch last 365 days or just current year/month. 
      // For heatmap usually we show a year or a few months.
      // Let's fetch last 6 months for now.
      const end = new Date();
      const start = subDays(end, 180);

      const params = new URLSearchParams({
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd')
      });

      const data = await api.get<DailySummary[]>(`/calendar/monthly?${params.toString()}`);
      setSummaries(data);
    } catch (error) {
      console.error("Failed to fetch calendar data", error);
    }
  };

  const fetchDailyDetail = async (dateStr: string) => {
    setLoadingDetail(true);
    try {
      const data = await api.get<DailyDetailResponse>(`/calendar/daily/${dateStr}`);
      setDailyDetail(data);
    } catch (error) {
      console.error("Failed to fetch daily detail", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const today = new Date();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">学习足迹 👣</h1>
        <p className="text-gray-600">记录你每一天的进步，积少成多。</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">本月学习天数</div>
          <div className="text-3xl font-bold text-indigo-600">
            {summaries.filter(s => s.date.startsWith(format(today, 'yyyy-MM')) && s.count > 0).length}
            <span className="text-sm text-gray-400 ml-2 font-normal">天</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">累计复习单词</div>
          <div className="text-3xl font-bold text-emerald-600">
            {summaries.reduce((acc, curr) => acc + curr.total_words, 0)}
            <span className="text-sm text-gray-400 ml-2 font-normal">个</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">当前连续打卡</div>
          <div className="text-3xl font-bold text-orange-500">
            {/* Mock streak for now, or calculate from summaries */}
            3
            <span className="text-sm text-gray-400 ml-2 font-normal">天</span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-6">活跃度热力图</h2>
        <div className="min-w-[800px]">
          <CalendarHeatmap
            startDate={subDays(today, 180)}
            endDate={today}
            values={summaries}
            classForValue={(value) => {
              if (!value) {
                return 'color-empty';
              }
              return `color-scale-${value.count}`;
            }}
            onClick={(value) => {
              if (value) setSelectedDate(value.date);
            }}
            titleForValue={(value) => {
              if (!value) return null;
              return `${value.date}: ${value.total_words} words, ${(value.total_time_ms / 60000).toFixed(0)} mins`;
            }}
            showWeekdayLabels
          />
        </div>
        <div className="flex items-center justify-end mt-4 text-xs text-gray-500 gap-2">
          <span>Less</span>
          <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-indigo-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-indigo-300 rounded-sm"></div>
          <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
          <div className="w-3 h-3 bg-indigo-700 rounded-sm"></div>
          <span>More</span>
        </div>
      </div>

      {/* Detail Panel (Slide over) */}
      <AnimatePresence>
        {selectedDate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {format(parseISO(selectedDate), 'MM月dd日', { locale: zhCN })}
                  </h2>
                  <p className="text-gray-500">{format(parseISO(selectedDate), 'yyyy年 EEEE', { locale: zhCN })}</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : dailyDetail ? (
                <div className="space-y-8">
                  {/* Daily Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">学习时长</span>
                      </div>
                      <div className="text-2xl font-bold text-indigo-900">
                        {(dailyDetail.total_time_ms / 60000).toFixed(0)}
                        <span className="text-sm font-normal ml-1">分钟</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-600 mb-1">
                        <Trophy className="w-4 h-4" />
                        <span className="text-sm font-medium">掌握新词</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-900">
                        {dailyDetail.mastered_count}
                        <span className="text-sm font-normal ml-1">个</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                      活动记录
                    </h3>

                    {dailyDetail.items.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        当日没有学习记录
                      </div>
                    ) : (
                      <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                        {dailyDetail.items.map((item) => (
                          <div key={item.id} className="relative pl-8">
                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 z-10"></div>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400 font-mono mb-1">{item.time}</span>
                              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="font-medium text-gray-900">{item.action}</div>
                                <div className="flex items-center gap-3 mt-2 text-sm">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium
                                    ${item.mode === 'learn' ? 'bg-blue-100 text-blue-700' :
                                      item.mode === 'test' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-700'}`}>
                                    {item.mode.toUpperCase()}
                                  </span>
                                  <span className="text-gray-500">{item.details}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  无法加载数据
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .react-calendar-heatmap text {
          font-size: 10px;
          fill: #aaa;
        }
        .react-calendar-heatmap .color-empty { fill: #f3f4f6; }
        .react-calendar-heatmap .color-scale-1 { fill: #e0e7ff; }
        .react-calendar-heatmap .color-scale-2 { fill: #a5b4fc; }
        .react-calendar-heatmap .color-scale-3 { fill: #6366f1; }
        .react-calendar-heatmap .color-scale-4 { fill: #4338ca; }
        .react-calendar-heatmap rect:hover { stroke: #555; stroke-width: 1px; }
      `}</style>
    </div>
  );
}
