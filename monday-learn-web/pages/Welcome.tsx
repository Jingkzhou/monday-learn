
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      {/* Illustration Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh]">
        <div className="w-64 h-64 bg-yellow-100 rounded-full relative flex items-center justify-center mb-8 overflow-hidden">
             <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="Student learning"
                className="w-full h-full object-cover opacity-90 mix-blend-multiply"
             />
             {/* Stylized Speech Bubble from screenshot */}
             <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-200 rounded-full blur-xl opacity-50"></div>
        </div>

        <h1 className="text-3xl font-black text-center text-gray-900 mb-2 tracking-tight">
            最佳学习方式。<br/>免费注册
        </h1>
        
        <p className="text-xs text-gray-400 text-center max-w-xs mt-4">
            注册即表示您接受 Quizlet 的<span className="underline cursor-pointer">服务条款</span>和<span className="underline cursor-pointer">隐私政策</span>
        </p>
      </div>

      {/* Actions Area */}
      <div className="space-y-4 w-full max-w-md mx-auto mb-8">
        {/* Google Button */}
        <button className="w-full py-3.5 px-4 bg-[#4255ff] hover:bg-[#3644cc] text-white font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
             <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
             </svg>
          </div>
          继续用 Google 登录
        </button>

        {/* Apple Button */}
        <button className="w-full py-3.5 px-4 bg-black hover:bg-gray-800 text-white font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
            <svg viewBox="0 0 384 512" width="20" height="20" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/>
            </svg>
            继续用 Apple 帐户登录
        </button>

        {/* Email Signup Button */}
        <button 
            onClick={() => navigate('/signup')}
            className="w-full py-3.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-full transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <Mail className="w-5 h-5 text-gray-500" />
          用电子邮件注册
        </button>
      </div>

      <div className="text-center pb-8">
          <button 
            onClick={() => navigate('/login')}
            className="text-primary font-bold text-sm hover:underline"
          >
              拥有帐户？ 登录
          </button>
      </div>
    </div>
  );
};
