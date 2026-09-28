import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onProceedTo2FA: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgotPassword';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onProceedTo2FA }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
      // App.tsx handles state change when dbUser resolves
    } catch (err: any) {
      setError(err.message || 'Google login failed. Please try again.');
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password || !captcha) {
          throw new Error('Please fill all required fields');
        }
        await signInWithEmail(email, password);
        onProceedTo2FA(); // Mock 2FA step transition
      } else if (mode === 'signup') {
        if (!email || !password || !confirmPassword) {
          throw new Error('Please fill all required fields');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signUpWithEmail(email, password);
        onProceedTo2FA();
      } else if (mode === 'forgotPassword') {
        if (!email) {
          throw new Error('Please enter your email address');
        }
        await resetPassword(email);
        setSuccess('Password reset link sent to your email.');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      // Handle Firebase specific error codes gracefully
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCaptcha('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#1e2329] p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 flex flex-col shadow-2xl transition-all duration-300">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 relative mb-4">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect x="25" y="10" width="20" height="20" rx="6" fill="#1b4d5e" />
              <rect x="5" y="40" width="20" height="20" rx="6" fill="#c46a24" />
              <rect x="20" y="65" width="20" height="20" rx="6" fill="#1b4d5e" />
              <path d="M 45 40 h 18 v -5 c 0 -8 18 -15 25 -15 h 5 v 20 c -8 0 -15 8 -15 15 c 0 7 7 15 15 15 v 20 h -5 c -7 0 -25 -7 -25 -15 v -5 h -18 c -10 0 -10 -15 -10 -15 s 0 -15 10 -15 z" fill="#c46a24" />
            </svg>
          </div>
          
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#1f2937] tracking-tight">
            Karpagam College of Engineering
          </h1>
          <p className="text-[12px] sm:text-[13px] text-[#6b7280] font-semibold mt-1 mb-6">
            {mode === 'login' && 'Login to your account to continue.'}
            {mode === 'signup' && 'Create a new institutional account.'}
            {mode === 'forgotPassword' && 'Enter your email to reset password.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg text-center font-semibold animate-pulse">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-800 text-sm rounded-lg text-center font-semibold">
            {success}
          </div>
        )}

        {/* Form Section */}
        <form className="flex flex-col gap-4" onSubmit={handleAction}>
          
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-[#374151] uppercase tracking-widest">
              EMAIL ADDRESS
            </label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[20px]">mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="institution@edu.in"
                className="w-full h-[46px] pl-10 pr-4 bg-[#f3f4f6] border-2 border-transparent rounded-lg text-[#1f2937] font-semibold placeholder-[#9ca3af] focus:bg-white focus:border-[#2563eb] outline-none text-[14px] transition-all"
                required
              />
            </div>
          </div>

          {/* Password (for login and signup) */}
          {(mode === 'login' || mode === 'signup') && (
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
              {mode === 'login' && (
                <div className="flex justify-end mt-0.5">
                  <button type="button" onClick={() => switchMode('forgotPassword')} className="text-[11px] font-bold text-[#6b7280] hover:text-[#2563eb] transition-colors">
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password (for signup) */}
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold text-[#374151] uppercase tracking-widest">
                CONFIRM PASSWORD
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[20px]">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full h-[46px] pl-10 pr-10 bg-[#f3f4f6] border-2 border-transparent rounded-lg text-[#1f2937] font-semibold placeholder-[#9ca3af] focus:bg-white focus:border-[#2563eb] outline-none text-[14px] tracking-wide transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Captcha Section (only for login) */}
          {mode === 'login' && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-3">
                <div className="h-[46px] w-[130px] bg-[#f3f4f6] border border-[#e5e7eb] rounded flex items-center justify-center relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] shrink-0">
                   <span className="text-[28px] font-mono font-extrabold tracking-widest text-[#1f2937] italic skew-x-[-12deg] skew-y-[5deg] opacity-90 z-10">572905</span>
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
                * This CAPTCHA will expire in 3 minutes.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[46px] bg-[#2257d5] hover:bg-[#1a44ab] disabled:bg-[#9ca3af] disabled:cursor-not-allowed text-white rounded-lg font-bold text-[14px] transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              {mode === 'login' ? 'Login Securely' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
            
            {/* Mode toggles */}
            <div className="flex justify-center items-center gap-2 mt-1">
              {mode === 'login' ? (
                <p className="text-[12px] font-semibold text-[#6b7280]">
                  New here? <button type="button" onClick={() => switchMode('signup')} className="text-[#2563eb] hover:underline focus:outline-none">Create a new account</button>
                </p>
              ) : (
                <p className="text-[12px] font-semibold text-[#6b7280]">
                  Remember your password? <button type="button" onClick={() => switchMode('login')} className="text-[#2563eb] hover:underline focus:outline-none">Back to Login</button>
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Divider */}
        {mode === 'login' && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
              <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Or continue with</span>
              <div className="flex-1 h-[1px] bg-[#e5e7eb]"></div>
            </div>

            {/* Google Auth Button (Firebase / GCP) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-[46px] bg-white border-2 border-[#e5e7eb] hover:bg-[#f9fafb] hover:border-[#d1d5db] text-[#374151] rounded-lg font-bold text-[14px] flex items-center justify-center gap-3 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google Workspace
            </button>
          </>
        )}

      </div>
    </div>
  );
};
