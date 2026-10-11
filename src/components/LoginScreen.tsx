import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { 
    signInWithGoogle, 
    signInWithSalesforce,
    signInWithEmail, 
    signUpWithEmail, 
    loginWithStudentId, 
    loginAsDemoUser, 
    loading, 
    authError, 
    clearAuthError 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'google_email' | 'student_id' | 'demo'>('google_email');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      if (emailMode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
    } catch (err) {
      // Handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;
    setSubmitting(true);
    try {
      await loginWithStudentId(studentIdInput.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0c131f] via-[#131b26] to-[#1c2534] p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl border border-gray-100 transition-all duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 relative mb-3">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
              <rect x="25" y="10" width="20" height="20" rx="6" fill="#1b4d5e" />
              <rect x="5" y="40" width="20" height="20" rx="6" fill="#c46a24" />
              <rect x="20" y="65" width="20" height="20" rx="6" fill="#1b4d5e" />
              <path d="M 45 40 h 18 v -5 c 0 -8 18 -15 25 -15 h 5 v 20 c -8 0 -15 8 -15 15 c 0 7 7 15 15 15 v 20 h -5 c -7 0 -25 -7 -25 -15 v -5 h -18 c -10 0 -10 -15 -10 -15 s 0 -15 10 -15 z" fill="#c46a24" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Digital Mess Token
          </h1>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
            Institutional Dining &amp; Management Portal
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl mt-5 mb-4 text-xs font-bold text-gray-600">
          <button
            type="button"
            onClick={() => { setActiveTab('google_email'); clearAuthError(); }}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              activeTab === 'google_email'
                ? 'bg-white text-gray-900 shadow-sm font-extrabold'
                : 'hover:text-gray-900'
            }`}
          >
            Google / Email
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('student_id'); clearAuthError(); }}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              activeTab === 'student_id'
                ? 'bg-white text-gray-900 shadow-sm font-extrabold'
                : 'hover:text-gray-900'
            }`}
          >
            Roll Number
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('demo'); clearAuthError(); }}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              activeTab === 'demo'
                ? 'bg-white text-gray-900 shadow-sm font-extrabold'
                : 'hover:text-gray-900'
            }`}
          >
            Demo Access
          </button>
        </div>

        {/* Inline Error Notice */}
        {authError && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start justify-between gap-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">error</span>
              <p className="leading-relaxed">{authError}</p>
            </div>
            <button 
              type="button" 
              onClick={clearAuthError}
              className="text-red-400 hover:text-red-600 font-bold ml-1 text-sm leading-none"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Google & Email Authentication */}
        {activeTab === 'google_email' && (
          <div className="flex flex-col gap-3.5">
            {/* Google Login Button */}
            <button 
              type="button" 
              onClick={signInWithGoogle} 
              disabled={loading || submitting}
              className="w-full h-12 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.99]"
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google Logo" 
                className="w-5 h-5" 
              />
              Continue with Google
            </button>

            {/* Salesforce OAuth Login Button */}
            <button 
              type="button" 
              onClick={signInWithSalesforce} 
              disabled={loading || submitting}
              className="w-full h-10 bg-[#0176D3]/10 hover:bg-[#0176D3]/20 border border-[#0176D3]/30 text-[#0176D3] rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">cloud</span>
              Sign in with Salesforce Org
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-gray-400 text-[11px] font-bold uppercase tracking-wider">or email</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              {emailMode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full h-10 mt-1 bg-[#1b4d5e] hover:bg-[#153e4b] text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Please wait...' : emailMode === 'signin' ? 'Sign In with Email' : 'Create Student Account'}
              </button>

              <div className="text-center mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode(emailMode === 'signin' ? 'signup' : 'signin');
                    clearAuthError();
                  }}
                  className="text-xs text-[#1b4d5e] hover:underline font-semibold"
                >
                  {emailMode === 'signin' 
                    ? "Don't have an account? Sign up here" 
                    : "Already registered? Sign in here"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Roll Number / Student ID Login */}
        {activeTab === 'student_id' && (
          <form onSubmit={handleStudentIdSubmit} className="flex flex-col gap-3 py-2">
            <p className="text-xs text-gray-500 mb-1">
              Registered students can enter their institutional Roll Number to access meal tokens and dining schedule.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Student Roll / ID No.
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 21CS1004 or 22EC1012"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                className="w-full h-11 px-3.5 border border-gray-300 rounded-lg font-mono text-sm uppercase text-gray-900 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 mt-2 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              {submitting ? 'Verifying...' : 'Access My Mess Tokens'}
            </button>
          </form>
        )}

        {/* Tab 3: Demo Access (Instant Fail-Safe) */}
        {activeTab === 'demo' && (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-gray-500 mb-2 leading-relaxed">
              Use instant demo access to evaluate all portal features (token issuance, QR scanner, meal menus, attendance reports) without credentials:
            </p>

            <button
              type="button"
              onClick={() => loginAsDemoUser('Admin')}
              className="w-full h-12 bg-gradient-to-r from-[#002045] to-[#1a365d] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              Enter as Mess Admin / Warden
            </button>

            <button
              type="button"
              onClick={() => loginAsDemoUser('Student')}
              className="w-full h-12 bg-white border-2 border-[#1b4d5e] text-[#1b4d5e] hover:bg-[#f0f7f9] rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">school</span>
              Enter as Student (Rahul Sharma)
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>Protected by Institutional Mess Cloud</span>
          <span className="font-semibold">v2.4</span>
        </div>

      </div>
    </div>
  );
};
