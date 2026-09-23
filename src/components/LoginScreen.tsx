import React, { useState } from 'react';

interface LoginScreenProps {
  onProceedTo2FA: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onProceedTo2FA }) => {
  const [role, setRole] = useState<'manager' | 'warden' | 'management'>('manager');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="min-h-screen bg-[#131b26] flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-[#1a365d] selection:text-white">
      {/* Outer Container mimicking the provided design border */}
      <div className="w-full max-w-[390px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border-[6px] border-[#5a54db]">
        {/* Top Header Strip */}
        <div className="bg-[#f0f4ff] px-4 py-3 border-b border-[#e5e7eb] flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#002045] text-[16px] font-bold">verified_user</span>
              <span className="text-[10px] font-extrabold text-[#002045] tracking-wider uppercase leading-tight">Institutional Mess<br/>Portal</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-[#e5e7eb]">
              <div className="w-2 h-2 rounded-full bg-[#0a6c44]" />
              <span className="text-[8px] font-bold text-[#43474e] uppercase tracking-wider">Secure 256-Bit</span>
            </div>
          </div>
          <div className="flex justify-between items-center bg-white px-2 py-1 rounded border border-[#e5e7eb]">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[#0a6c44] text-[14px]">router</span>
              <span className="text-[9px] font-bold text-[#0a6c44] tracking-wide uppercase">Portal Node F06 • Active Service</span>
            </div>
            <span className="bg-[#9ff5c1] text-[#005231] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* Logo and Title */}
        <div className="flex flex-col items-center px-6 pt-6 pb-4 border-b border-[#e5e7eb] bg-[#f8f9ff]">
          <div className="w-14 h-14 bg-[#002045] rounded-xl flex items-center justify-center mb-3 shadow-md">
            <span className="material-symbols-outlined text-white text-[28px]">restaurant</span>
          </div>
          <div className="flex items-center gap-1 mb-1 text-[#ba1a1a]">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span className="text-[9px] font-bold uppercase tracking-wider">Authorized Personnel Only</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-[#002045] tracking-tight mb-1">Mess Token Manager</h1>
          <p className="text-[10px] text-[#43474e] text-center font-medium leading-relaxed px-4">
            Institutional Dining & Meal Distribution Portal - Strict RBAC enforced
          </p>
        </div>

        <div className="px-5 py-5 flex flex-col gap-6">
          {/* Role Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end mb-1">
              <h2 className="text-[13px] font-bold text-[#0d1c2e] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                Select Institutional Role
              </h2>
              <span className="text-[10px] font-semibold text-[#74777f]">Step 1 of 2</span>
            </div>

            {/* Role Options */}
            <div className="flex flex-col gap-2">
              <label className={`flex flex-col p-2.5 rounded-lg border-2 cursor-pointer transition-all ${role === 'manager' ? 'border-[#002045] bg-[#f0f4ff]' : 'border-[#e5e7eb] bg-white hover:border-[#c4c6cf]'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <input type="radio" name="role" value="manager" checked={role === 'manager'} onChange={() => setRole('manager')} className="mt-0.5 w-4 h-4 text-[#002045] focus:ring-[#002045] border-gray-300" />
                    <div>
                      <p className="text-[12px] font-bold text-[#002045] leading-tight mb-0.5">Mess Manager</p>
                      <p className="text-[9px] text-[#43474e] font-medium leading-tight">Token verification, daily count & menu distribution</p>
                    </div>
                  </div>
                  <span className="bg-[#9ff5c1] text-[#005231] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5">Operations</span>
                </div>
              </label>

              <label className={`flex flex-col p-2.5 rounded-lg border-2 cursor-pointer transition-all ${role === 'warden' ? 'border-[#002045] bg-[#f0f4ff]' : 'border-[#e5e7eb] bg-white hover:border-[#c4c6cf]'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <input type="radio" name="role" value="warden" checked={role === 'warden'} onChange={() => setRole('warden')} className="mt-0.5 w-4 h-4 text-[#002045] focus:ring-[#002045] border-gray-300" />
                    <div>
                      <p className="text-[12px] font-bold text-[#002045] leading-tight mb-0.5">Chief Warden</p>
                      <p className="text-[9px] text-[#43474e] font-medium leading-tight">Hostel discipline, token clearance & student validation</p>
                    </div>
                  </div>
                  <span className="bg-[#e5eeff] text-[#002045] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5">Supervisory</span>
                </div>
              </label>

              <label className={`flex flex-col p-2.5 rounded-lg border-2 cursor-pointer transition-all ${role === 'management' ? 'border-[#002045] bg-[#f0f4ff]' : 'border-[#e5e7eb] bg-white hover:border-[#c4c6cf]'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <input type="radio" name="role" value="management" checked={role === 'management'} onChange={() => setRole('management')} className="mt-0.5 w-4 h-4 text-[#002045] focus:ring-[#002045] border-gray-300" />
                    <div>
                      <p className="text-[12px] font-bold text-[#002045] leading-tight mb-0.5">College Management</p>
                      <p className="text-[9px] text-[#43474e] font-medium leading-tight">Institutional oversight, billing audit & dining logs</p>
                    </div>
                  </div>
                  <span className="bg-[#ffdbcd] text-[#93000a] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 mt-0.5">Audit Mode</span>
                </div>
              </label>
            </div>
            
            <p className="text-[9px] text-[#ba1a1a] flex items-center gap-1 font-semibold mt-1">
              <span className="material-symbols-outlined text-[12px]">gpp_bad</span>
              Unauthorized staff & students cannot access this console.
            </p>
          </div>

          {/* Credentials Section */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end border-b border-[#e5e7eb] pb-2">
              <h2 className="text-[13px] font-bold text-[#0d1c2e]">Credentials Authentication</h2>
              <span className="text-[9px] font-bold text-[#0a6c44] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                Encrypted TLS 1.3
              </span>
            </div>

            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onProceedTo2FA(); }}>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#0d1c2e]">Institutional Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#74777f] text-[18px]">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mess.ops@campus.edu"
                    className="w-full h-10 pl-10 pr-3 border-2 border-[#e5e7eb] rounded-lg bg-[#f8f9ff] focus:bg-white focus:border-[#002045] focus:ring-0 outline-none text-[13px] font-medium transition-colors placeholder-[#74777f]"
                    required
                  />
                </div>
                <p className="text-[9px] text-[#74777f] font-medium pl-1 mt-0.5">Use college domain (@campus.edu or @college.edu)</p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#0d1c2e]">Access Security PIN / Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#74777f] text-[18px]">password</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 pl-10 pr-10 border-2 border-[#e5e7eb] rounded-lg bg-[#f8f9ff] focus:bg-white focus:border-[#002045] focus:ring-0 outline-none text-[13px] font-medium transition-colors tracking-widest placeholder-[#74777f]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#74777f] hover:text-[#002045] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Captcha Section */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-bold text-[#0d1c2e] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">shield</span>
                    Security Verification
                  </label>
                  <span className="text-[9px] text-[#74777f] font-medium">Case-sensitive</span>
                </div>
                <div className="flex items-center gap-2 border-2 border-[#e5e7eb] rounded-lg p-2 bg-[#f8f9ff]">
                  <div className="flex-1 h-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-[#dce9ff] rounded flex items-center justify-center relative overflow-hidden">
                     {/* Fake captcha text */}
                     <span className="text-[22px] font-mono font-bold tracking-widest text-[#002045] italic skew-x-[-10deg] opacity-80">8XK4M</span>
                     {/* Scratch lines for realism */}
                     <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#0d1c2e] opacity-40 rotate-[5deg]"></div>
                     <div className="absolute top-1/3 left-0 w-full h-[1px] bg-[#0d1c2e] opacity-30 -rotate-[8deg]"></div>
                  </div>
                  <button type="button" className="w-10 h-10 flex items-center justify-center text-[#43474e] hover:text-[#002045] hover:bg-[#e5eeff] rounded transition-colors shrink-0">
                    <span className="material-symbols-outlined text-[20px]">refresh</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={captcha}
                  onChange={(e) => setCaptcha(e.target.value)}
                  placeholder="ENTER CHARACTERS SHOWN ABOVE"
                  className="w-full h-10 px-3 border-2 border-[#e5e7eb] rounded-lg bg-white focus:border-[#002045] focus:ring-0 outline-none text-[12px] font-bold text-center tracking-widest transition-colors uppercase placeholder-[#a1a3aa] mt-2"
                  required
                />
              </div>

              {/* Actions & Links */}
              <div className="flex justify-between items-center mt-2 mb-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#002045] focus:ring-[#002045] border-gray-300"
                  />
                  <span className="text-[11px] font-bold text-[#0d1c2e]">Remember Terminal</span>
                </label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-bold text-[#002045] hover:underline">Reset PIN</a>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Sign in to Portal
              </button>
            </form>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
              <span className="text-[10px] font-bold text-[#74777f] uppercase tracking-wider">Or Continue With</span>
              <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
            </div>

            <button
              type="button"
              onClick={onProceedTo2FA}
              className="w-full h-11 bg-white border-2 border-[#e5e7eb] hover:bg-[#f8f9ff] text-[#0d1c2e] rounded-lg font-bold text-[13px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google Workspace
            </button>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="bg-[#f0f4ff] p-4 border-t border-[#e5e7eb] flex items-start gap-3 mt-auto">
          <span className="material-symbols-outlined text-[#002045] text-[18px] shrink-0 mt-0.5">policy</span>
          <div>
            <h3 className="text-[11px] font-extrabold text-[#002045] mb-1">Institutional Access Compliance Notice</h3>
            <p className="text-[9px] text-[#43474e] font-medium leading-relaxed mb-2">
              This terminal is strictly monitored. Only certified Mess Managers, Chief Wardens, and College Management are provisioned with credentials. All login attempts, failed auth, and token scans are securely mirrored with IP address and timestamp to the Salesforce CRM institutional database.
            </p>
            <p className="text-[8px] text-[#74777f] font-bold text-center border-t border-[#e5e7eb] pt-2 mt-2">
              SYNCED WITH CAMPUS SALESFORCE INSTANCE<br/>
              MESS TOKEN MANAGEMENT SUITE • ENTERPRISE RELEASE V2.01
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
