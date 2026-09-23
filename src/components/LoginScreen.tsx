import React, { useState } from 'react';

interface LoginScreenProps {
  onProceedTo2FA: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onProceedTo2FA }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#1e2329] p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center">
          {/* Custom SVG Logo mimicking the 'K' logo uploaded */}
          <div className="w-16 h-16 relative mb-4">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Top Left Teal Square */}
              <rect x="25" y="10" width="20" height="20" rx="6" fill="#1b4d5e" />
              {/* Mid Left Orange Square */}
              <rect x="5" y="40" width="20" height="20" rx="6" fill="#c46a24" />
              {/* Bottom Left Teal Square */}
              <rect x="20" y="65" width="20" height="20" rx="6" fill="#1b4d5e" />
              {/* Main 'K' Orange Shape */}
              <path d="M 45 40 h 18 v -5 c 0 -8 18 -15 25 -15 h 5 v 20 c -8 0 -15 8 -15 15 c 0 7 7 15 15 15 v 20 h -5 c -7 0 -25 -7 -25 -15 v -5 h -18 c -10 0 -10 -15 -10 -15 s 0 -15 10 -15 z" fill="#c46a24" />
            </svg>
          </div>
          
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#1f2937] tracking-tight">
            Karpagam College of Engineering
          </h1>
          <p className="text-[12px] sm:text-[13px] text-[#6b7280] font-semibold mt-1 mb-6">
            Login to your account to continue.
          </p>
        </div>

        {/* Form Section */}
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onProceedTo2FA(); }}>
          
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-[#374151] uppercase tracking-widest">
              USERNAME
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[20px]">person</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full h-[46px] pl-10 pr-4 bg-[#f3f4f6] border-2 border-transparent rounded-lg text-[#1f2937] font-semibold placeholder-[#9ca3af] focus:bg-white focus:border-[#2563eb] outline-none text-[14px] transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-[#374151] uppercase tracking-widest">
              PASSWORD
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[20px]">lock</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-[46px] pl-10 pr-10 bg-[#f3f4f6] border-2 border-transparent rounded-lg text-[#1f2937] font-semibold placeholder-[#9ca3af] focus:bg-white focus:border-[#2563eb] outline-none text-[14px] tracking-wide transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <div className="flex justify-end mt-0.5">
              <button type="button" className="text-[11px] font-bold text-[#6b7280] hover:text-[#374151] transition-colors">
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Captcha Section */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center gap-3">
              {/* Fake Captcha Image */}
              <div className="h-[46px] w-[130px] bg-[#f3f4f6] border border-[#e5e7eb] rounded flex items-center justify-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] shrink-0">
                 <span className="text-[28px] font-mono font-extrabold tracking-widest text-[#1f2937] italic skew-x-[-12deg] skew-y-[5deg] opacity-90 z-10">572905</span>
                 {/* Noise lines */}
                 <div className="absolute top-1/2 left-[-10%] w-[120%] h-[2px] bg-[#4b5563] opacity-60 rotate-[15deg]"></div>
                 <div className="absolute top-1/3 left-[-10%] w-[120%] h-[1px] bg-[#1f2937] opacity-50 -rotate-[8deg]"></div>
                 <div className="absolute top-2/3 left-[-10%] w-[120%] h-[1.5px] bg-[#374151] opacity-40 rotate-[5deg]"></div>
              </div>
              
              <button type="button" className="text-[#4b5563] hover:text-[#111827] transition-colors shrink-0">
                <span className="material-symbols-outlined text-[26px]">sync</span>
              </button>

              <input
                type="text"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                className="flex-1 h-[40px] px-3 border border-[#d1d5db] rounded text-[#1f2937] font-bold text-center tracking-widest focus:border-[#2563eb] outline-none text-[16px] transition-all bg-white min-w-0"
                required
              />
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#ef4444] font-medium leading-snug mt-1">
              * This CAPTCHA will expire in 3 minutes. Kindly refresh for a new CAPTCHA
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => { setUsername(''); setPassword(''); setCaptcha(''); }}
              className="flex-1 h-[46px] bg-[#e15253] hover:bg-[#c93f40] text-white rounded-lg font-semibold text-[14px] transition-colors shadow-sm"
            >
              Reset
            </button>
            <button
              type="submit"
              className="flex-1 h-[46px] bg-[#2257d5] hover:bg-[#1a44ab] text-white rounded-lg font-semibold text-[14px] transition-colors shadow-sm"
            >
              Login
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
          <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Or</span>
          <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
        </div>

        {/* Google Auth Button (Firebase / GCP) */}
        <button
          type="button"
          onClick={onProceedTo2FA}
          className="w-full h-[46px] bg-white border-2 border-[#e5e7eb] hover:bg-[#f9fafb] hover:border-[#d1d5db] text-[#374151] rounded-lg font-bold text-[14px] flex items-center justify-center gap-3 transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

      </div>
    </div>
  );
};
