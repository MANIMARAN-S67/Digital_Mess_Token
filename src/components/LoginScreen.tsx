import React, { useState, useEffect } from 'react';
import { useAuth, isStudentIdentifier } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    checkEmailExists,
    checkPhoneExists,
    sendPhoneOtp,
    sendLoginPhoneOtp,
    verifyPhoneOtp,
    signInWithPhoneOtp,
    sendPasswordResetOtp,
    resetPasswordWithOtp,
    loginAsDemoUser,
    loading, 
    authError, 
    clearAuthError 
  } = useAuth();

  // Mode: 'signin' | 'signup' | 'forgot_password'
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');

  // Sign In States
  const [signInMethod, setSignInMethod] = useState<'email' | 'phone'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginEmailWarning, setLoginEmailWarning] = useState('');

  // Sign In Phone States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPhoneOtp, setLoginPhoneOtp] = useState('');
  const [isLoginPhoneOtpSent, setIsLoginPhoneOtpSent] = useState(false);
  const [loginPhoneOtpCountdown, setLoginPhoneOtpCountdown] = useState(0);
  const [sentLoginOtpCode, setSentLoginOtpCode] = useState('');
  const [loginPhoneError, setLoginPhoneError] = useState('');
  const [loginPhoneLoading, setLoginPhoneLoading] = useState(false);

  // Sign Up States
  const [signupRole, setSignupRole] = useState<'Mess Manager' | 'College Principal'>('Mess Manager');
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupEmailWarning, setSignupEmailWarning] = useState('');
  const [emailDuplicateError, setEmailDuplicateError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState('');
  const [phoneDuplicateError, setPhoneDuplicateError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [sentOtpCode, setSentOtpCode] = useState('');
  const [phoneOtpCountdown, setPhoneOtpCountdown] = useState(0);

  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'enter_email' | 'verify_and_reset' | 'completed'>('enter_email');
  const [emailOtp, setEmailOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [emailSimulatorToast, setEmailSimulatorToast] = useState<{ email: string; otp: string } | null>(null);
  const [forgotCountdown, setForgotCountdown] = useState(0);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // General loading & feedback
  const [submitting, setSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [localSuccessMsg, setLocalSuccessMsg] = useState('');

  // Timer countdown effect for Phone OTP
  useEffect(() => {
    if (phoneOtpCountdown > 0) {
      const timer = setTimeout(() => setPhoneOtpCountdown(phoneOtpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneOtpCountdown]);

  // Timer countdown effect for Login Phone OTP
  useEffect(() => {
    if (loginPhoneOtpCountdown > 0) {
      const timer = setTimeout(() => setLoginPhoneOtpCountdown(loginPhoneOtpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [loginPhoneOtpCountdown]);

  // Timer countdown effect for Email OTP
  useEffect(() => {
    if (forgotCountdown > 0) {
      const timer = setTimeout(() => setForgotCountdown(forgotCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotCountdown]);

  // Helper: Strong Password Validation
  const checkPasswordStrength = (pass: string) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pass);
    
    const count = [minLength, (hasUpper && hasLower), hasNumber, hasSpecial].filter(Boolean).length;
    const isStrong = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isStrong,
      score: count // 0 - 4
    };
  };

  const signupPassStrength = checkPasswordStrength(signupPassword);
  const newPassStrength = checkPasswordStrength(newPassword);

  const handleLoginEmailChange = (val: string) => {
    setLoginEmail(val);
    if (isStudentIdentifier(val)) {
      setLoginEmailWarning('Notice: Students cannot log in here. Only Mess Managers and College Principals are authorized.');
    } else {
      setLoginEmailWarning('');
    }
  };

  const handleSignupEmailChange = (val: string) => {
    setSignupEmail(val);
    setEmailDuplicateError('');
    if (isStudentIdentifier(val)) {
      setSignupEmailWarning('Notice: Student registration is prohibited on this portal. Only Mess Managers and College Principals may register.');
    } else {
      setSignupEmailWarning('');
    }
  };

  // Real-time duplicate email validation for signup
  const handleEmailBlur = async () => {
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setEmailDuplicateError('');
      return;
    }
    if (isStudentIdentifier(signupEmail.trim())) {
      setSignupEmailWarning('Notice: Student registration is prohibited on this portal. Only Mess Managers and College Principals may register.');
      return;
    }
    setIsCheckingEmail(true);
    try {
      const exists = await checkEmailExists(signupEmail.trim());
      if (exists) {
        setEmailDuplicateError('This email is already registered. Duplicate emails are not allowed.');
      } else {
        setEmailDuplicateError('');
      }
    } catch {
      setEmailDuplicateError('');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleClick = async () => {
    setIsGoogleSigningIn(true);
    clearAuthError();
    try {
      await signInWithGoogle();
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return;
    if (isStudentIdentifier(loginEmail.trim())) {
      setLoginEmailWarning('Access Denied: Only Mess Managers and the College Principal are authorized to log in with their email. Students are not allowed to log in here.');
      return;
    }
    setSubmitting(true);
    clearAuthError();
    try {
      await signInWithEmail(loginEmail.trim(), loginPassword);
    } catch {
      // Error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  // Real-time duplicate phone validation for signup
  const checkPhoneUnique = async (phoneToCheck: string) => {
    const clean = phoneToCheck.replace(/\D/g, '').slice(-10);
    if (clean.length !== 10) {
      setPhoneDuplicateError('');
      return;
    }
    setIsCheckingPhone(true);
    try {
      const exists = await checkPhoneExists(clean);
      if (exists) {
        setPhoneDuplicateError('This mobile number is already registered. Duplicate phone numbers are not allowed.');
      } else {
        setPhoneDuplicateError('');
      }
    } catch {
      setPhoneDuplicateError('');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  // Phone input formatting (digits only, max 10)
  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    setPhoneOtpError('');
    setPhoneDuplicateError('');
    // Reset verification if user modifies phone number
    if (isPhoneVerified) {
      setIsPhoneVerified(false);
      setIsPhoneOtpSent(false);
      setPhoneOtp('');
      setSentOtpCode('');
    }
    if (cleaned.length === 10) {
      checkPhoneUnique(cleaned);
    }
  };

  // Send Phone OTP (Sign Up)
  const handleSendPhoneOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setPhoneOtpError('Phone number must be exactly 10 digits.');
      return;
    }
    if (phoneDuplicateError) {
      return;
    }

    setPhoneOtpLoading(true);
    setPhoneOtpError('');
    try {
      const exists = await checkPhoneExists(cleanPhone);
      if (exists) {
        setPhoneDuplicateError('This mobile number is already registered. Duplicate phone numbers are not allowed.');
        setPhoneOtpLoading(false);
        return;
      }
      const res = await sendPhoneOtp(cleanPhone);
      setIsPhoneOtpSent(true);
      setPhoneOtpCountdown(60);
      setSentOtpCode(res.otp);
    } catch (err: any) {
      setPhoneOtpError(err?.message || 'Failed to dispatch OTP.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // Verify Phone OTP (Sign Up)
  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.trim().length !== 6) {
      setPhoneOtpError('Please enter the complete 6-digit OTP code.');
      return;
    }
    setPhoneOtpLoading(true);
    setPhoneOtpError('');
    try {
      await verifyPhoneOtp(phone, phoneOtp.trim());
      setIsPhoneVerified(true);
    } catch (err: any) {
      setPhoneOtpError(err?.message || 'Incorrect OTP code.');
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  // Send Login Phone OTP (Sign In)
  const handleSendLoginPhoneOtp = async () => {
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setLoginPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoginPhoneLoading(true);
    setLoginPhoneError('');
    try {
      const res = await sendLoginPhoneOtp(cleanPhone);
      setIsLoginPhoneOtpSent(true);
      setLoginPhoneOtpCountdown(60);
      setSentLoginOtpCode(res.otp);
    } catch (err: any) {
      setLoginPhoneError(err?.message || 'Failed to send OTP to this number.');
    } finally {
      setLoginPhoneLoading(false);
    }
  };

  // Verify and Sign In with Phone OTP
  const handleLoginWithPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPhoneOtp.trim().length !== 6) {
      setLoginPhoneError('Please enter the complete 6-digit OTP code.');
      return;
    }
    setSubmitting(true);
    setLoginPhoneError('');
    try {
      await signInWithPhoneOtp(loginPhone, loginPhoneOtp.trim());
    } catch (err: any) {
      setLoginPhoneError(err?.message || 'Mobile login failed. Please verify the OTP code.');
    } finally {
      setSubmitting(false);
    }
  };

  // Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();

    // 0. Strict Student Account Block
    if (isStudentIdentifier(signupEmail.trim())) {
      setSignupEmailWarning('Notice: Student accounts cannot be created here. Only Mess Managers and College Principals may register.');
      alert('Students cannot register on this portal. Only Mess Managers and the College Principal are authorized.');
      return;
    }

    // 1. Check all required fields
    if (!fullName.trim() || !signupEmail.trim() || !phone.trim() || !signupPassword || !confirmPassword) {
      alert('All fields are strictly required.');
      return;
    }

    // 2. Validate 10-digit phone number
    if (phone.length !== 10) {
      setPhoneOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // 3. Ensure no duplicate phone
    if (phoneDuplicateError) {
      setPhoneOtpError('Cannot register with an existing phone number.');
      return;
    }

    // 4. Ensure phone OTP is verified
    if (!isPhoneVerified) {
      setPhoneOtpError('Please verify your phone number with the OTP code before registering.');
      return;
    }

    // 5. Validate duplicate email
    if (emailDuplicateError) {
      return;
    }

    // 5. Validate strong password
    if (!signupPassStrength.isStrong) {
      alert('Password is not strong enough. Please satisfy all password security requirements.');
      return;
    }

    // 6. Check passwords match
    if (signupPassword !== confirmPassword) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await signUpWithEmail(signupEmail.trim(), signupPassword, fullName.trim(), phone, signupRole);
    } catch {
      // Error handled in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  // Forgot Password: Send OTP to Email
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      alert('Please enter a valid institutional email address.');
      return;
    }
    setSubmitting(true);
    clearAuthError();
    try {
      const res = await sendPasswordResetOtp(forgotEmail.trim());
      setForgotStep('verify_and_reset');
      setForgotCountdown(60);
      setForgotSuccessMsg(res.message);
      setEmailSimulatorToast({ email: forgotEmail.trim(), otp: res.otp });
    } catch (err: any) {
      alert(err?.message || 'Failed to send password reset OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  // Forgot Password: Verify OTP & Set New Password
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();

    if (!emailOtp.trim()) {
      alert('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    if (!newPassStrength.isStrong) {
      alert('New password must meet all strong password requirements.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPasswordWithOtp(forgotEmail.trim(), emailOtp.trim(), newPassword);
      setForgotStep('completed');
      setForgotSuccessMsg(res.message);
      setEmailSimulatorToast(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0c131f] via-[#131b26] to-[#1c2534] p-4 sm:p-6 font-sans">
      


      {/* Real-time Institutional Email OTP Notification Banner */}
      {emailSimulatorToast && (
        <div className="fixed top-5 left-5 z-50 max-w-sm bg-gray-900 border border-sky-500/40 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-bounce-short">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">mark_email_read</span>
              <span>Institutional Mailer • OTP Sent</span>
            </div>
            <button 
              type="button" 
              onClick={() => setEmailSimulatorToast(null)} 
              className="text-gray-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-300 mt-2">
            Password reset OTP sent to <strong className="text-white">{emailSimulatorToast.email}</strong>:
          </p>
          <div className="mt-2 flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-white/10">
            <span className="font-mono text-xl font-extrabold text-sky-400 tracking-widest">
              {emailSimulatorToast.otp}
            </span>
            <button
              type="button"
              onClick={() => {
                setEmailOtp(emailSimulatorToast.otp);
                setEmailSimulatorToast(null);
              }}
              className="text-[11px] bg-sky-600 hover:bg-sky-500 text-white px-2.5 py-1 rounded-lg font-bold"
            >
              Auto-Fill
            </button>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="w-full max-w-[480px] bg-white rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl border border-gray-100 transition-all duration-300">
        
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

          {/* Administrative Role Badge */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-[11px] font-bold shadow-2xs">
            <span className="material-symbols-outlined text-[15px] text-amber-600">admin_panel_settings</span>
            <span>Mess Manager &amp; College Principal Portal</span>
          </div>
          <p className="text-[11px] text-red-600 font-semibold mt-1 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">block</span>
            <span>Students cannot log in on this page</span>
          </p>
        </div>

        {/* Access Control Notice Banner */}
        <div className="mt-3.5 p-3 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 shadow-2xs">
          <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">verified_user</span>
          <div className="text-left">
            <p className="font-bold text-[11px] text-amber-900">Authorized Personnel Only</p>
            <p className="text-[11px] text-amber-800/90 mt-0.5 leading-snug">
              Only authorized <strong>Mess Managers</strong> and the <strong>College Principal</strong> can log in to view mess operations, issue tokens to students, and audit attendance. All logins and token activities are synchronized to the <strong>Salesforce</strong> backend.
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start justify-between gap-2 animate-fadeIn">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0">error</span>
              <p className="leading-relaxed font-medium">{authError}</p>
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

        {/* Success Banner */}
        {localSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span>{localSuccessMsg}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setLocalSuccessMsg('')} 
              className="text-emerald-500 hover:text-emerald-700 font-bold text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mode Switcher Tabs (Only shown when not in forgot password mode) */}
        {mode !== 'forgot_password' && (
          <div className="flex items-center bg-gray-100 p-1 rounded-xl mt-5 mb-4 text-xs font-bold text-gray-600">
            <button
              type="button"
              onClick={() => { setMode('signin'); clearAuthError(); }}
              className={`flex-1 py-2 text-center rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-gray-900 shadow-sm font-extrabold'
                  : 'hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); clearAuthError(); }}
              className={`flex-1 py-2 text-center rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-gray-900 shadow-sm font-extrabold'
                  : 'hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: SIGN IN MODE                                          */}
        {/* ------------------------------------------------------------- */}
        {mode === 'signin' && (
          <div className="flex flex-col gap-3.5 mt-1">
            {/* Google Login Button */}
            <button 
              type="button" 
              onClick={handleGoogleClick} 
              disabled={loading || submitting || isGoogleSigningIn}
              className="w-full h-12 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-70"
            >
              {isGoogleSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                  <span>Choose Google Account...</span>
                </>
              ) : (
                <>
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google Logo" 
                    className="w-5 h-5" 
                  />
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Sign In Method Selector Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold text-gray-600 mb-1">
              <button
                type="button"
                onClick={() => { setSignInMethod('email'); clearAuthError(); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  signInMethod === 'email' ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'hover:text-gray-900'
                }`}
              >
                Email &amp; Password
              </button>
              <button
                type="button"
                onClick={() => { setSignInMethod('phone'); clearAuthError(); }}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  signInMethod === 'phone' ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'hover:text-gray-900'
                }`}
              >
                Mobile Number (OTP)
              </button>
            </div>

            {/* Method A: Email & Password Form */}
            {signInMethod === 'email' && (
              <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Institutional Email (Mess Manager / Principal) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      required
                      placeholder="manager@institution.edu or principal@institution.edu"
                      value={loginEmail}
                      onChange={(e) => handleLoginEmailChange(e.target.value)}
                      className={`w-full h-11 px-3.5 border rounded-xl text-sm text-gray-900 outline-none transition-all ${
                        loginEmailWarning
                          ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e]'
                      }`}
                    />
                    <span className="material-symbols-outlined text-[18px] text-gray-400 absolute right-3 pointer-events-none">mail</span>
                  </div>
                  {loginEmailWarning && (
                    <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 font-semibold flex items-center gap-1.5 animate-fadeIn">
                      <span className="material-symbols-outlined text-[15px] text-red-600 shrink-0">block</span>
                      <span>{loginEmailWarning}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setForgotEmail(loginEmail);
                        setForgotStep('enter_email');
                        clearAuthError();
                      }}
                      className="text-[11px] text-[#1b4d5e] hover:underline font-bold"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e] outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showLoginPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || loading || Boolean(loginEmailWarning)}
                  className="w-full h-11 mt-1 bg-[#1b4d5e] hover:bg-[#153e4b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99]"
                >
                  {submitting ? 'Authenticating & Syncing to Salesforce...' : 'Sign In as Manager / Principal'}
                </button>
              </form>
            )}

            {/* Method B: Mobile Number + OTP Form */}
            {signInMethod === 'phone' && (
              <form onSubmit={handleLoginWithPhoneSubmit} className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Registered Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-gray-400">
                      {loginPhone.length}/10 digits
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex items-center px-2.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 shrink-0">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit mobile number"
                      value={loginPhone}
                      onChange={(e) => {
                        setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setLoginPhoneError('');
                        setIsLoginPhoneOtpSent(false);
                        setLoginPhoneOtp('');
                        setSentLoginOtpCode('');
                      }}
                      className="flex-1 h-11 px-3 border border-gray-300 rounded-xl text-sm font-mono text-gray-900 focus:border-[#1b4d5e] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendLoginPhoneOtp}
                      disabled={loginPhone.length !== 10 || loginPhoneLoading || loginPhoneOtpCountdown > 0}
                      className="px-3.5 h-11 bg-[#1b4d5e] hover:bg-[#153e4b] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs"
                    >
                      {loginPhoneLoading ? 'Sending...' : loginPhoneOtpCountdown > 0 ? `${loginPhoneOtpCountdown}s` : isLoginPhoneOtpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {/* Login OTP input section */}
                {isLoginPhoneOtpSent && (
                  <div className="p-3 bg-gradient-to-br from-emerald-50/70 to-slate-50 border border-emerald-200 rounded-2xl flex flex-col gap-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">sms</span>
                        <span>SMS Dispatched</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        Valid for 10m
                      </span>
                    </div>

                    {sentLoginOtpCode && (
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-100 shadow-2xs">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 font-medium">Original Verification Code</span>
                          <span className="font-mono text-base font-extrabold text-emerald-700 tracking-widest">
                            {sentLoginOtpCode}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLoginPhoneOtp(sentLoginOtpCode)}
                          className="text-[11px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 py-1 rounded-lg font-bold transition-all shadow-xs"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">
                        Enter 6-Digit SMS OTP
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={loginPhoneOtp}
                        onChange={(e) => setLoginPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="h-10 px-3 border border-gray-300 rounded-xl font-mono text-base tracking-widest text-center text-gray-900 focus:border-[#1b4d5e] bg-white outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || loginPhoneOtp.length !== 6}
                      className="w-full h-10 mt-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xs"
                    >
                      {submitting ? 'Verifying...' : 'Verify OTP & Sign In'}
                    </button>
                  </div>
                )}

                {loginPhoneError && (
                  <p className="text-[11px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {loginPhoneError}
                  </p>
                )}
              </form>
            )}

            {/* Instant Authorized Test Profiles */}
            <div className="mt-2 pt-3 border-t border-gray-100 flex flex-col gap-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider text-center">
                Instant Authorized Test Logins (Synced to Salesforce)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => loginAsDemoUser('Mess Manager')}
                  disabled={loading || submitting}
                  className="p-2.5 rounded-xl border border-[#1b4d5e]/30 bg-sky-50/50 hover:bg-sky-100/60 text-[#1b4d5e] text-left transition-all flex flex-col group active:scale-98"
                >
                  <span className="text-[11px] font-extrabold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">restaurant_menu</span>
                    Mess Manager
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5 truncate">manager@institution.edu</span>
                </button>
                <button
                  type="button"
                  onClick={() => loginAsDemoUser('College Principal')}
                  disabled={loading || submitting}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-purple-900 text-left transition-all flex flex-col group active:scale-98"
                >
                  <span className="text-[11px] font-extrabold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    College Principal
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5 truncate">principal@institution.edu</span>
                </button>
              </div>
            </div>

            {/* Sign up here link */}
            <div className="text-center mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Need administrative access? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearAuthError();
                }}
                className="text-xs text-[#1b4d5e] hover:underline font-extrabold"
              >
                Register as Manager / Principal
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: SIGN UP MODE                                          */}
        {/* ------------------------------------------------------------- */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3.5 mt-1">
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5 text-center">
              <p className="text-[11px] font-semibold text-sky-800">
                Institutional Staff Registration (Mess Manager &amp; College Principal Only)
              </p>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">
                Designated Institutional Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignupRole('Mess Manager')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                    signupRole === 'Mess Manager'
                      ? 'border-[#1b4d5e] bg-sky-50/70 text-[#1b4d5e] font-extrabold ring-1 ring-[#1b4d5e]'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
                    <span>Mess Manager</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-0.5">Issue tokens &amp; dining audit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupRole('College Principal')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                    signupRole === 'College Principal'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-extrabold ring-1 ring-purple-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="material-symbols-outlined text-[16px]">school</span>
                    <span>College Principal</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-0.5">Executive overview</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Rajesh Kumar or S. Ramanathan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e] outline-none"
              />
            </div>

            {/* Email Address with Duplicate Check */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase">
                  Institutional Email Address <span className="text-red-500">*</span>
                </label>
                {isCheckingEmail && (
                  <span className="text-[10px] text-sky-600 font-semibold animate-pulse">Checking availability...</span>
                )}
              </div>
              <input
                type="email"
                required
                placeholder="manager@institution.edu or principal@institution.edu"
                value={signupEmail}
                onChange={(e) => handleSignupEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                className={`w-full h-10 px-3.5 border rounded-xl text-sm text-gray-900 outline-none transition-all ${
                  emailDuplicateError || signupEmailWarning
                    ? 'border-red-400 bg-red-50/50 focus:border-red-500' 
                    : 'border-gray-300 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e]'
                }`}
              />
              {signupEmailWarning && (
                <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <span className="material-symbols-outlined text-[15px] text-red-600 shrink-0">block</span>
                  <span>{signupEmailWarning}</span>
                </div>
              )}
              {emailDuplicateError && (
                <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {emailDuplicateError}
                </p>
              )}
            </div>

            {/* Phone Number (10 Digits) & OTP Verification */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase">
                  Phone Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {isCheckingPhone && (
                    <span className="text-[10px] text-sky-600 font-semibold animate-pulse">
                      Checking uniqueness...
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-gray-400">
                    {phone.length}/10 digits
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex items-center px-2.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 shrink-0">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  required
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => checkPhoneUnique(phone)}
                  className={`flex-1 h-10 px-3 border rounded-xl text-sm font-mono text-gray-900 outline-none transition-all ${
                    phoneDuplicateError 
                      ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                      : isPhoneVerified 
                      ? 'border-emerald-500 bg-emerald-50/40' 
                      : 'border-gray-300 focus:border-[#1b4d5e]'
                  }`}
                />
                {!isPhoneVerified ? (
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={phone.length !== 10 || phoneOtpLoading || phoneOtpCountdown > 0 || Boolean(phoneDuplicateError)}
                    className="px-3.5 h-10 bg-[#1b4d5e] hover:bg-[#153e4b] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs"
                  >
                    {phoneOtpLoading ? 'Sending...' : phoneOtpCountdown > 0 ? `${phoneOtpCountdown}s` : isPhoneOtpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 h-10 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold shrink-0 border border-emerald-200">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                    <span>Verified</span>
                  </div>
                )}
              </div>

              {phoneDuplicateError && (
                <p className="text-[11px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {phoneDuplicateError}
                </p>
              )}

              {/* Clean, Non-duplicate OTP Verification Panel */}
              {isPhoneOtpSent && !isPhoneVerified && (
                <div className="mt-3 p-3.5 bg-gradient-to-br from-emerald-50/70 to-slate-50 border border-emerald-200 rounded-2xl flex flex-col gap-2.5 animate-fadeIn shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <span className="material-symbols-outlined text-[16px] text-emerald-600">sms</span>
                      <span>SMS Dispatched</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Valid for 10m
                    </span>
                  </div>

                  {sentOtpCode && (
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-emerald-100 shadow-2xs">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-medium">Original OTP Code</span>
                        <span className="font-mono text-base font-extrabold text-emerald-700 tracking-widest">
                          {sentOtpCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhoneOtp(sentOtpCode)}
                        className="text-[11px] bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-2.5 py-1 rounded-lg font-bold transition-all shadow-xs"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 mt-0.5">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="flex-1 h-10 px-3 border border-gray-300 rounded-xl font-mono text-sm tracking-widest text-center text-gray-900 focus:border-[#1b4d5e] focus:bg-white bg-white/90 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPhoneOtp}
                      disabled={phoneOtp.length !== 6 || phoneOtpLoading}
                      className="px-4 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-xs active:scale-98"
                    >
                      {phoneOtpLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </div>
              )}

              {/* Status feedback */}
              {phoneOtpError && (
                <p className="text-[11px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {phoneOtpError}
                </p>
              )}
              {isPhoneVerified && (
                <p className="text-[11px] font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Phone number verified successfully!
                </p>
              )}
            </div>

            {/* Password with Strong Password Meter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 8 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full h-10 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e] outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showSignupPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Password Strength Indicator */}
              {signupPassword.length > 0 && (
                <div className="mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-gray-500 uppercase tracking-wider">Password Strength:</span>
                    <span className={
                      signupPassStrength.isStrong 
                        ? 'text-emerald-600 font-extrabold' 
                        : signupPassStrength.score >= 2 
                        ? 'text-amber-600 font-extrabold' 
                        : 'text-red-600 font-extrabold'
                    }>
                      {signupPassStrength.isStrong ? 'Strong' : signupPassStrength.score >= 2 ? 'Medium' : 'Weak'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 transition-all ${signupPassStrength.score >= 1 ? 'bg-red-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all ${signupPassStrength.score >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all ${signupPassStrength.score >= 3 ? 'bg-amber-400' : 'bg-transparent'}`} />
                    <div className={`h-full flex-1 transition-all ${signupPassStrength.isStrong ? 'bg-emerald-500' : 'bg-transparent'}`} />
                  </div>

                  {/* Dynamic Rule Checklist */}
                  <div className="grid grid-cols-2 gap-1 mt-2 text-[10px]">
                    <div className={`flex items-center gap-1 ${signupPassStrength.minLength ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                      <span>{signupPassStrength.minLength ? '✓' : '•'}</span> 8+ Characters
                    </div>
                    <div className={`flex items-center gap-1 ${signupPassStrength.hasUpper && signupPassStrength.hasLower ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                      <span>{signupPassStrength.hasUpper && signupPassStrength.hasLower ? '✓' : '•'}</span> Upper &amp; Lowercase
                    </div>
                    <div className={`flex items-center gap-1 ${signupPassStrength.hasNumber ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                      <span>{signupPassStrength.hasNumber ? '✓' : '•'}</span> Number (0-9)
                    </div>
                    <div className={`flex items-center gap-1 ${signupPassStrength.hasSpecial ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                      <span>{signupPassStrength.hasSpecial ? '✓' : '•'}</span> Symbol (!@#$...)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full h-10 px-3.5 border rounded-xl text-sm text-gray-900 outline-none pr-10 ${
                    confirmPassword && confirmPassword !== signupPassword 
                      ? 'border-red-400 bg-red-50/30' 
                      : confirmPassword && confirmPassword === signupPassword 
                      ? 'border-emerald-400 bg-emerald-50/20' 
                      : 'border-gray-300 focus:border-[#1b4d5e]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {confirmPassword && confirmPassword !== signupPassword && (
                <p className="text-[10px] font-bold text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>

            {/* Submit Registration Button */}
            <button
              type="submit"
              disabled={
                submitting || 
                loading || 
                !fullName.trim() || 
                !signupEmail.trim() || 
                !phone.trim() || 
                !isPhoneVerified ||
                !signupPassStrength.isStrong ||
                signupPassword !== confirmPassword ||
                Boolean(emailDuplicateError) ||
                Boolean(phoneDuplicateError) ||
                Boolean(signupEmailWarning)
              }
              className="w-full h-11 mt-2 bg-[#1b4d5e] hover:bg-[#153e4b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99]"
            >
              {submitting ? 'Registering & Syncing to Salesforce...' : `Register as ${signupRole}`}
            </button>

            {/* Switch to sign in */}
            <div className="text-center mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">Already registered as staff? </span>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearAuthError();
                }}
                className="text-xs text-[#1b4d5e] hover:underline font-extrabold"
              >
                Sign in here
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: FORGOT PASSWORD FLOW (EMAIL OTP)                      */}
        {/* ------------------------------------------------------------- */}
        {mode === 'forgot_password' && (
          <div className="flex flex-col gap-3.5 mt-2">
            
            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setForgotStep('enter_email');
                clearAuthError();
              }}
              className="self-start flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Sign In</span>
            </button>

            {/* Step 1: Enter Registered Email */}
            {forgotStep === 'enter_email' && (
              <form onSubmit={handleSendEmailOtp} className="flex flex-col gap-3">
                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-left">
                  <h3 className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                    <span>Forgot Your Password?</span>
                  </h3>
                  <p className="text-[11px] text-sky-700 mt-1 leading-relaxed">
                    Enter your registered email address. We will send a 6-digit verification OTP to your email so you can set a new password.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Registered Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="manager@institution.edu or principal@institution.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-[#1b4d5e] focus:ring-1 focus:ring-[#1b4d5e] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !forgotEmail.trim()}
                  className="w-full h-11 bg-[#1b4d5e] hover:bg-[#153e4b] disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99]"
                >
                  {submitting ? 'Sending OTP to Email...' : 'Send Verification OTP'}
                </button>
              </form>
            )}

            {/* Step 2: Enter Email OTP & Set New Password */}
            {forgotStep === 'verify_and_reset' && (
              <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <span className="material-symbols-outlined text-[16px]">mark_email_read</span>
                    <span>OTP Dispatched</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Verification code sent to <strong>{forgotEmail}</strong>.
                  </p>
                </div>

                {/* 6-Digit Email OTP */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold text-gray-600 uppercase">
                      Email OTP Code <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      disabled={forgotCountdown > 0 || submitting}
                      onClick={async () => {
                        const res = await sendPasswordResetOtp(forgotEmail);
                        setForgotCountdown(60);
                        setEmailSimulatorToast({ email: forgotEmail, otp: res.otp });
                      }}
                      className="text-[11px] font-bold text-[#1b4d5e] hover:underline disabled:text-gray-400"
                    >
                      {forgotCountdown > 0 ? `Resend OTP in ${forgotCountdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full h-11 px-3.5 border border-gray-300 rounded-xl text-center font-mono text-base tracking-widest text-gray-900 focus:border-[#1b4d5e] outline-none"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    New Strong Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new strong password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-10 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-[#1b4d5e] outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Password Strength Checklist for New Password */}
                  {newPassword.length > 0 && (
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                        <span className="text-gray-500 uppercase tracking-wider">Strength:</span>
                        <span className={newPassStrength.isStrong ? 'text-emerald-600' : 'text-amber-600'}>
                          {newPassStrength.isStrong ? 'Strong' : 'Needs more complexity'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className={newPassStrength.minLength ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                          {newPassStrength.minLength ? '✓' : '•'} 8+ Chars
                        </span>
                        <span className={newPassStrength.hasUpper && newPassStrength.hasLower ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                          {newPassStrength.hasUpper && newPassStrength.hasLower ? '✓' : '•'} Upper &amp; Lower
                        </span>
                        <span className={newPassStrength.hasNumber ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                          {newPassStrength.hasNumber ? '✓' : '•'} 1+ Number
                        </span>
                        <span className={newPassStrength.hasSpecial ? 'text-emerald-700 font-bold' : 'text-gray-400'}>
                          {newPassStrength.hasSpecial ? '✓' : '•'} 1+ Symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full h-10 px-3.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:border-[#1b4d5e] outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmNewPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {confirmNewPassword && confirmNewPassword !== newPassword && (
                    <p className="text-[10px] font-bold text-red-500 mt-1">Passwords do not match.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || emailOtp.length !== 6 || !newPassStrength.isStrong || newPassword !== confirmNewPassword}
                  className="w-full h-11 mt-1 bg-[#1b4d5e] hover:bg-[#153e4b] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.99]"
                >
                  {submitting ? 'Updating Password...' : 'Verify OTP & Create New Password'}
                </button>
              </form>
            )}

            {/* Step 3: Completed Successfully */}
            {forgotStep === 'completed' && (
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Password Updated Successfully!
                </h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Your new password has been verified and saved. You can now sign in using your email and updated password.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setLoginEmail(forgotEmail);
                    setLoginPassword('');
                    setForgotStep('enter_email');
                  }}
                  className="w-full h-11 mt-2 bg-[#1b4d5e] hover:bg-[#153e4b] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
