import React, { useState } from 'react';

interface LoginScreenProps {
  onProceedTo2FA: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onProceedTo2FA }) => {
  const [role, setRole] = useState<'manager' | 'warden' | 'management'>('manager');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden font-sans selection:bg-[#3b82f6] selection:text-white p-4">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Login Card - Glassmorphism */}
      <div className="w-full max-w-[420px] bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all duration-500">
        
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 flex flex-col items-center text-center relative">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(37,99,235,0.4)] transform transition hover:scale-105 duration-300">
            <span className="material-symbols-outlined text-white text-[32px]">restaurant</span>
          </div>
          <h1 className="text-[26px] font-extrabold text-white tracking-tight mb-2">Digital Mess Token</h1>
          <p className="text-[13px] text-slate-300 font-medium">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Form Section */}
        <div className="px-8 pb-8 flex flex-col gap-5">
          {/* Compact Role Selection (Segmented Control) */}
          <div className="flex bg-slate-800/50 p-1.5 rounded-xl border border-white/5 shadow-inner">
            {(['manager', 'warden', 'management'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all duration-300 capitalize ${
                  role === r 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {r === 'management' ? 'Audit' : r}
              </button>
            ))}
          </div>

          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onProceedTo2FA(); }}>
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-slate-300 pl-1">Email Address</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] group-focus-within:text-blue-400 transition-colors">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full h-11 pl-10 pr-4 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-[14px] transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-slate-300 pl-1">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] group-focus-within:text-blue-400 transition-colors">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 pl-10 pr-10 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-[14px] tracking-wider transition-all shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Remember & Reset */}
            <div className="flex justify-between items-center px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <span className="text-[12px] font-medium text-slate-300 group-hover:text-white transition-colors">Remember me</span>
              </label>
              <button type="button" className="text-[12px] font-medium text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-[0_0_20px_rgba(37,99,235,0.3)] mt-2"
            >
              Sign In
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-0.5">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Or</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>

          {/* Google Workspace */}
          <button
            type="button"
            onClick={onProceedTo2FA}
            className="w-full h-12 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold text-[14px] flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};
