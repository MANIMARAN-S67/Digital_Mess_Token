import React from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#131b26] to-[#1e2329] p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[440px] bg-white rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl transition-all duration-300">
        
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
          
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Digital Mess Token
          </h1>
          <p className="text-sm text-gray-500 font-semibold mt-1 mb-6">
            Continue with Google to login.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 mt-4">
          <button 
            type="button" 
            onClick={signInWithGoogle} 
            disabled={loading}
            className="w-full h-12 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

      </div>
    </div>
  );
};
