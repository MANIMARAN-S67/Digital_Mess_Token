import React, { useState, useRef, useEffect } from 'react';

interface TwoFactorScreenProps {
  onAuthenticate: () => void;
  onBackToLogin: () => void;
}

export const TwoFactorScreen: React.FC<TwoFactorScreenProps> = ({ onAuthenticate, onBackToLogin }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (newCode.every(v => v !== '')) {
      // Auto submit when all filled
      setTimeout(() => {
        onAuthenticate();
      }, 300);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#131b26] flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-[#1a365d] selection:text-white">
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
            <span className="text-[#002045] text-[9px] font-bold uppercase tracking-wider">TLS 1.3<br/>Secured</span>
          </div>
        </div>

        {/* Identity Verification Header */}
        <div className="px-5 pt-5 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 bg-[#002045] rounded-xl flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-white text-[24px]">shield_person</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#74777f] uppercase tracking-wider mb-0.5">Mess Token Manager</span>
            <h1 className="text-[18px] font-extrabold text-[#002045] tracking-tight leading-tight">Identity Verification</h1>
          </div>
          <span className="ml-auto text-[10px] font-semibold text-[#74777f] shrink-0">Step 2 of 2</span>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-5">
          <p className="text-[12px] text-[#002045] font-medium leading-relaxed bg-[#e5eeff] p-3 rounded-lg border border-[#adc7f7]">
            <span className="font-bold">High-privilege portal session detected.</span> Please enter the cryptographic verification token sent to your registered institutional authenticator.
          </p>

          {/* Verified Identity Block */}
          <div className="border border-[#e5e7eb] rounded-lg p-3 bg-[#f8f9ff]">
            <div className="flex justify-between items-center mb-3 border-b border-[#e5e7eb] pb-2">
              <div className="flex items-center gap-1.5 bg-[#0a6c44] px-2 py-1 rounded">
                <span className="material-symbols-outlined text-white text-[14px]">account_circle</span>
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Mess Manager</span>
              </div>
              <span className="text-[9px] font-bold text-[#0a6c44] uppercase flex items-center gap-1">
                Credentials Verified <span className="material-symbols-outlined text-[12px]">check_circle</span>
              </span>
            </div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] text-[#74777f] font-bold uppercase">Operator Identity</span>
              <span className="text-[11px] font-mono font-bold text-[#002045]">STAFF-ID: MM-4091</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-[#74777f] font-bold uppercase">Secured Dispatch</span>
              <span className="text-[11px] font-mono font-bold text-[#002045]">m***.ops@campus.edu</span>
            </div>
          </div>

          {/* Code Input Section */}
          <div className="flex flex-col items-center">
            <h2 className="text-[11px] font-bold text-[#0d1c2e] uppercase flex items-center gap-1.5 mb-3">
              <span className="material-symbols-outlined text-[16px]">phonelink_ring</span>
              TOTP Authenticator & Institutional SMS
            </h2>
            <p className="text-[10px] text-[#74777f] font-medium text-center mb-4 px-2">
              Enter the 6-digit rolling code generated by Google Authenticator, Duo, or your verified device:
            </p>

            <div className="flex items-center gap-2 mb-4">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-[42px] h-[52px] border-2 border-[#e5e7eb] rounded-lg bg-[#f8f9ff] text-center text-[24px] font-bold text-[#002045] focus:border-[#002045] focus:bg-white focus:ring-0 outline-none transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#74777f]">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              Resend Code in <span className="font-bold text-[#002045] font-mono">00:00</span>
              <button className="text-[#002045] font-bold hover:underline ml-2">Resend Now</button>
            </div>
          </div>

          <button
            onClick={onAuthenticate}
            className="w-full h-12 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md mt-2"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            Verify & Launch Console
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          {/* Alternative Auth Methods */}
          <div className="flex flex-col gap-2 mt-2">
            <button className="w-full h-10 bg-white border border-[#e5e7eb] hover:bg-[#f8f9ff] text-[#0d1c2e] rounded flex items-center justify-center gap-2 text-[11px] font-bold transition-colors">
              <span className="material-symbols-outlined text-[16px] text-[#0a6c44]">fingerprint</span>
              Authenticate with Biometrics (Face ID / Touch ID)
            </button>
            <button className="w-full h-10 bg-white border border-[#e5e7eb] hover:bg-[#f8f9ff] text-[#0d1c2e] rounded flex items-center justify-center gap-2 text-[11px] font-bold transition-colors">
              <span className="material-symbols-outlined text-[16px] text-[#0a6c44]">usb</span>
              Hardware Key (YubiKey / WebAuthn)
            </button>
          </div>

          {/* Bottom Links */}
          <div className="flex justify-between items-center mt-2 border-t border-[#e5e7eb] pt-4">
            <button onClick={onBackToLogin} className="text-[11px] font-bold text-[#43474e] hover:text-[#002045] flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
              Switch Account / Back to Step 1
            </button>
            <button className="text-[11px] font-bold text-[#c05621] hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">emergency</span>
              Warden Bypass
            </button>
          </div>
        </div>

        {/* Footer Notice */}
        <div className="bg-[#f0f4ff] p-4 border-t border-[#e5e7eb] flex items-start gap-3 mt-auto">
          <span className="material-symbols-outlined text-[#002045] text-[18px] shrink-0 mt-0.5">admin_panel_settings</span>
          <div>
            <h3 className="text-[11px] font-extrabold text-[#002045] mb-1">Institutional Access Compliance</h3>
            <p className="text-[9px] text-[#43474e] font-medium leading-relaxed mb-1">
              Salesforce Identity MFA enforced. IP address and geofenced mess terminal telemetry are logged for cryptographic session authentication token generation. Compliant with NIST SP 800-63B and HEOA TOTP specifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
