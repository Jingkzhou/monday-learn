
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Logo } from '../components/Logo';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-gray-100 sticky top-0 bg-white z-50">
        <div className="flex items-center gap-8">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <Logo />
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <button className="hover:text-gray-900">学习工具 <span className="text-xs">▼</span></button>
            <button className="hover:text-gray-900">科目 <span className="text-xs">▼</span></button>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="更快速地搜索查找"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#4255ff]/20 focus:border-[#4255ff] transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden md:flex items-center gap-1 text-gray-600 font-semibold hover:text-gray-900">
            <Plus className="w-4 h-4" /> 创建
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-50 rounded-md transition-colors"
          >
            登录
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 bg-[#4255ff] hover:bg-[#3644cc] text-white font-bold rounded-md transition-colors"
          >
            注册
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
          您想如何学习？
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          通过MondayQuizlet的互动式单词卡、模拟测试和学习活动，掌握所学知识。
        </p>
        <button
          onClick={() => navigate('/signup')}
          className="px-8 py-4 bg-[#4255ff] hover:bg-[#3644cc] text-white font-bold rounded-md text-lg shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
        >
          免费注册
        </button>
        <div className="mt-4">
          <button className="text-[#4255ff] font-bold hover:underline">我是教师</button>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="px-4 md:px-8 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Learn */}
          <div className="bg-[#a8e5ff] rounded-2xl p-6 h-80 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4">学习</h3>
            <div className="bg-white rounded-xl p-4 shadow-sm absolute bottom-0 left-4 right-4 -mb-12 group-hover:mb-4 transition-all duration-300">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-12 bg-gray-200 rounded-md overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=100&q=80" className="w-full h-full object-cover" alt="Art" />
                </div>
                <span className="font-medium">la pintura</span>
              </div>
              <div className="h-8 bg-gray-100 rounded flex items-center px-3 text-sm text-gray-500">
                入答案
              </div>
            </div>
            <div className="absolute top-1/2 left-2 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm z-10">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Card 2: Flashcards */}
          <div className="bg-[#4255ff] rounded-2xl p-6 h-80 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
            <h3 className="text-xl font-bold text-white mb-4">单词卡</h3>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white w-48 h-32 rounded-xl shadow-lg transform rotate-[-5deg] flex items-center justify-center p-4 relative z-10">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">上腔静脉</div>
                  <img src="https://cdn-icons-png.flaticon.com/512/2492/2492923.png" className="w-12 h-12 mx-auto opacity-80" alt="Heart" />
                </div>
              </div>
              <div className="bg-white w-48 h-32 rounded-xl shadow-md absolute transform rotate-[5deg] opacity-50"></div>
            </div>
          </div>

          {/* Card 3: Test */}
          <div className="bg-[#ffcd1f] rounded-2xl p-6 h-80 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4">测试</h3>
            <div className="bg-white rounded-xl p-6 absolute inset-x-6 top-20 bottom-6 shadow-sm flex flex-col items-center justify-center">
              <div className="text-sm font-bold text-gray-500 mb-2">您的时间：6分钟</div>
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#eee" strokeWidth="8" fill="none" />
                  <circle cx="48" cy="48" r="40" stroke="#2ecc71" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset="62.8" />
                </svg>
                <span className="absolute text-2xl font-bold text-gray-700">75%</span>
              </div>
              <div className="flex gap-4 mt-4 text-xs font-bold">
                <div className="flex items-center gap-1 text-green-500 bg-green-50 px-2 py-1 rounded"><Check className="w-3 h-3" /> 9</div>
                <div className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded"><X className="w-3 h-3" /> 3</div>
              </div>
            </div>
          </div>

          {/* Card 4: Match */}
          <div className="bg-[#ffdac1] rounded-2xl p-6 h-80 relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-4">配对</h3>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-white p-2 rounded-lg shadow-sm h-20 flex items-center justify-center"><img src="https://cdn-icons-png.flaticon.com/512/822/822102.png" className="w-8 h-8 opacity-60" alt="Stomach" /></div>
              <div className="bg-gray-100 p-2 rounded-lg h-20"></div>
              <div className="bg-gray-100 p-2 rounded-lg h-20"></div>
              <div className="bg-green-50 border-2 border-green-400 p-2 rounded-lg h-20 flex items-center justify-center relative">
                <img src="https://cdn-icons-png.flaticon.com/512/2867/2867306.png" className="w-8 h-8" alt="Lungs" />
                <div className="absolute top-1 left-1 bg-green-400 rounded-full p-0.5"><Check className="w-2 h-2 text-white" /></div>
              </div>
              <div className="bg-green-50 border-2 border-green-400 p-2 rounded-lg h-20 flex items-center justify-center text-sm font-bold text-green-800 relative">
                肺
                <div className="absolute top-1 left-1 bg-green-400 rounded-full p-0.5"><Check className="w-2 h-2 text-white" /></div>
              </div>
              <div className="bg-gray-100 p-2 rounded-lg h-20"></div>
            </div>
            <div className="absolute right-2 top-1/2 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm z-10">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* App Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              每堂课、每场考试，一个终极<br />学习应用程序
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              创建自己的教学单词卡，或查找教师、学生和专家制作的学习集。使用我们的免费应用程序随时随地学习。
            </p>
            <div className="flex gap-4">
              <button className="bg-black text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" /></svg>
                <div className="text-left">
                  <div className="text-[10px] leading-none">Download on the</div>
                  <div className="text-sm font-bold leading-none mt-1">App Store</div>
                </div>
              </button>
              <button className="bg-black text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L3.84,2.15C3.84,2.15 6.05,2.66 6.05,2.66Z" /></svg>
                <div className="text-left">
                  <div className="text-[10px] leading-none">GET IT ON</div>
                  <div className="text-sm font-bold leading-none mt-1">Google Play</div>
                </div>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-[#8c9eff] rounded-2xl p-8 flex items-center justify-center relative overflow-hidden h-80 w-full">
            {/* Abstract App UI Mockup */}
            <div className="bg-white rounded-xl shadow-2xl p-4 w-64 absolute right-12 top-12 transform rotate-[-2deg]">
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                <Search className="w-4 h-4 text-gray-400" />
                <div className="text-gray-400 text-xs">世界地理</div>
              </div>
              <div className="bg-white border rounded-lg p-8 flex items-center justify-center shadow-sm mb-2">
                <span className="font-bold text-gray-800 text-lg">南非</span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-2xl p-4 w-48 absolute left-12 bottom-8 transform rotate-[5deg] z-10">
              <div className="w-full h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                <img src="https://cdn-icons-png.flaticon.com/512/2072/2072130.png" className="w-16 h-16 opacity-50" alt="Map" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Method Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-12">
          <div className="flex-1 text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              选择学习方式
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              通过学习模式将单词卡转变为选择题等。通过配对等学习游戏巩固知识。
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-[#4255ff] hover:bg-[#3644cc] text-white font-bold rounded-md shadow-md transition-colors"
            >
              开始
            </button>
          </div>
          <div className="flex-1 bg-[#a8e5ff] rounded-2xl p-8 h-80 w-full flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-[#4255ff] border-t-transparent animate-spin"></div>
                  <span className="font-bold text-gray-700">学习</span>
                </div>
                <img src="https://cdn-icons-png.flaticon.com/512/4310/4310163.png" className="w-12 h-12" alt="Tree" />
              </div>
              <div className="space-y-3">
                <div className="font-bold text-green-500 text-sm">太棒了！</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded p-3 text-sm text-gray-600">Tierra</div>
                  <div className="border rounded p-3 text-sm text-gray-600">Hoja</div>
                  <div className="border rounded p-3 text-sm text-gray-600">Raiz</div>
                  <div className="border border-green-400 bg-green-50 rounded p-3 text-sm text-green-700 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Árbol
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher Section */}
      <section className="py-20 px-4 bg-[#eef1ff]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-left">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">教师</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              增强学生的能力
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              帮助每个学生自信地学习任何知识。有了免费的单词卡学习集、学习模式和课堂游戏（如MondayQuizlet Live），您可以立即创建更有吸引力的课堂。
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-[#4255ff] hover:bg-[#3644cc] text-white font-bold rounded-md shadow-md transition-colors"
            >
              注册成为教师
            </button>
            <div className="mt-4">
              <button className="text-[#4255ff] font-bold hover:underline">了解教师如何使用MondayQuizlet</button>
            </div>
          </div>
          <div className="flex-1 h-96 w-full rounded-2xl overflow-hidden shadow-xl relative">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
              alt="Teacher and students"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold text-gray-900">
                MondayQuizlet
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-16 pb-8 px-4 border-t border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div>
            <h4 className="font-bold text-gray-900 mb-4">关于我们</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="hover:text-[#4255ff] cursor-pointer">关于MondayQuizlet</li>
              <li className="hover:text-[#4255ff] cursor-pointer">工作机会</li>
              <li className="hover:text-[#4255ff] cursor-pointer">广告宣传</li>
              <li className="hover:text-[#4255ff] cursor-pointer">获取应用</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">学生</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="hover:text-[#4255ff] cursor-pointer">单词卡</li>
              <li className="hover:text-[#4255ff] cursor-pointer">学习</li>
              <li className="hover:text-[#4255ff] cursor-pointer">解决方案</li>
              <li className="hover:text-[#4255ff] cursor-pointer">MondayQuizlet Plus</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">对于老师</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="hover:text-[#4255ff] cursor-pointer">Live</li>
              <li className="hover:text-[#4255ff] cursor-pointer">帮助中心</li>
              <li className="hover:text-[#4255ff] cursor-pointer">博客</li>
              <li className="hover:text-[#4255ff] cursor-pointer">MondayQuizlet Plus教师版</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">资源</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="hover:text-[#4255ff] cursor-pointer">帮助中心</li>
              <li className="hover:text-[#4255ff] cursor-pointer">注册</li>
              <li className="hover:text-[#4255ff] cursor-pointer">行为准则</li>
              <li className="hover:text-[#4255ff] cursor-pointer">社区准则</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">语言</h4>
            <select className="text-sm border-none bg-transparent font-semibold text-gray-600 focus:ring-0 cursor-pointer">
              <option>中文 (简体)</option>
              <option>English</option>
            </select>
            <div className="mt-8">
              {/* QR Code Placeholder */}
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="w-20 h-20 border-4 border-black p-1">
                  <div className="w-full h-full bg-black/10 grid grid-cols-4 gap-0.5">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div className="flex gap-4">
            <span>© 2025 MondayQuizlet, Inc.</span>
            <span className="hover:text-[#4255ff] cursor-pointer">隐私政策</span>
            <span className="hover:text-[#4255ff] cursor-pointer">服务条款</span>
          </div>
          <div className="flex gap-4">
            {/* Social Icons */}
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};
