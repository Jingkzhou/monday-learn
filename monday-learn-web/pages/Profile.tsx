
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, CreditCard, Bell, Moon, LogOut, Award, Flame, Calendar, MapPin } from 'lucide-react';

export const Profile: React.FC = () => {
    const navigate = useNavigate();
    const user = {
        username: 'Linh_30_12',
        name: 'Linh Nguyen',
        email: 'linh.nguyen@example.com',
        role: '教师', // Teacher
        school: '阳光小学',
        joinDate: '2023年11月',
        streak: 12,
        setsCreated: 24,
        totalStudyTime: '48小时'
    };

    return (
        <div className="pt-20 px-4 md:px-8 md:ml-64 pb-10 min-h-screen bg-bg-gray">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                    {/* Cover Photo */}
                    <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                        <button className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Profile Info */}
                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
                            <div className="w-24 h-24 rounded-full bg-purple-600 text-white text-4xl font-bold flex items-center justify-center border-4 border-white shadow-md relative">
                                L
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="在线"></div>
                            </div>
                            <div className="flex-1 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                                <div className="text-gray-500 font-medium flex flex-wrap gap-4 mt-1 text-sm">
                                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {user.name}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {user.school}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> 加入于 {user.joinDate}</span>
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none px-6 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                                    编辑资料
                                </button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{user.setsCreated}</div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">学习集</div>
                            </div>
                            <div className="text-center border-l border-gray-100">
                                <div className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                                    {user.streak} <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                                </div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">周连胜</div>
                            </div>
                            <div className="text-center border-l border-gray-100">
                                <div className="text-2xl font-bold text-gray-900">Top 10%</div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">班级排名</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Achievements Column */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-yellow-500" />
                                近期成就
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">📚</div>
                                    <div>
                                        <div className="font-bold text-indigo-900">孜孜不倦</div>
                                        <div className="text-xs text-indigo-600">连续学习7天</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-lg bg-green-50 border border-green-100">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">🎯</div>
                                    <div>
                                        <div className="font-bold text-green-900">百发百中</div>
                                        <div className="text-xs text-green-600">在测试模式中获得100分</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100 opacity-60">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm">⚡</div>
                                    <div>
                                        <div className="font-bold text-gray-500">速记大师</div>
                                        <div className="text-xs text-gray-400">1分钟内完成配对游戏</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">订阅状态</h3>
                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white">
                                <div>
                                    <div className="font-bold text-lg mb-1">Quizlet Plus</div>
                                    <div className="text-indigo-100 text-sm">有效期至 2025年12月31日</div>
                                </div>
                                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-bold transition-colors">
                                    管理订阅
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings Column */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4 px-2">账户设置</h3>
                            <div className="space-y-1">
                                <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <span className="flex-1 font-medium text-sm">个人信息</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                    <Bell className="w-5 h-5 text-gray-400" />
                                    <span className="flex-1 font-medium text-sm">通知偏好</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                    <CreditCard className="w-5 h-5 text-gray-400" />
                                    <span className="flex-1 font-medium text-sm">支付方式</span>
                                </button>
                                <div className="h-px bg-gray-100 my-2"></div>
                                <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left">
                                    <Moon className="w-5 h-5 text-gray-400" />
                                    <span className="flex-1 font-medium text-sm">深色模式</span>
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="flex-1 font-bold text-sm">退出登录</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
