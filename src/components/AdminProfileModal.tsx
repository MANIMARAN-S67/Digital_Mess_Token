import React from 'react';
import { useAuth } from '../context/AuthContext';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMessHall?: string;
  onSelectMessHall?: (hall: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetAllSessions?: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  selectedMessHall = 'Central Mess Hall A',
  onSelectMessHall,
  soundEnabled,
  onToggleSound,
  onResetAllSessions
}) => {
  const { dbUser, signOut } = useAuth();

  if (!isOpen) return null;

  const halls = ['Central Mess Hall A', 'South Campus Mess B', 'Girls Hostel Diners C', 'Executive Dining D'];

  const userName = dbUser?.name || 'Administrator';
  const userEmail = dbUser?.email || 'admin@institution.edu';
  const userRole = dbUser?.role || 'Admin';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'AD';

  const handleSignOut = async () => {
    onClose();
    await signOut();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c4c6cf] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#002045] text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">account_circle</span>
            <h3 className="text-[17px] font-bold">User Profile &amp; Facility</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* User Card */}
          <div className="flex items-center gap-3 p-3.5 bg-[#eff4ff] rounded-xl border border-[#c4c6cf]/50">
            {dbUser?.photoUrl ? (
              <img
                src={dbUser.photoUrl}
                alt={userName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-[#002045]/20 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#1a365d] text-white flex items-center justify-center font-bold text-[16px] shadow-xs">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-[#0d1c2e] truncate">{userName}</p>
              <p className="text-[12px] text-[#43474e] truncate font-medium">{userEmail}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2 py-0.5 bg-[#9ff5c1] text-[#005231] text-[10px] font-bold uppercase rounded">
                  {userRole}
                </span>
                {dbUser?.department && (
                  <span className="text-[10px] text-[#74777f] truncate">
                    {dbUser.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 text-[12px] space-y-1.5">
            <div className="flex justify-between items-center text-gray-600">
              <span className="font-medium">User ID / Roll:</span>
              <span className="font-mono font-bold text-gray-900">{dbUser?.studentId || dbUser?.Id || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span className="font-medium">Diet Preference:</span>
              <span className="font-semibold text-gray-900">{dbUser?.preference || 'Veg'}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span className="font-medium">Hostel / Location:</span>
              <span className="font-semibold text-gray-900">{dbUser?.hostelRoom || 'Admin Office'}</span>
            </div>
          </div>

          {/* Dining Facility Switcher */}
          <div>
            <label className="block text-[11px] font-bold text-[#43474e] uppercase mb-1">
              Assigned Dining Facility
            </label>
            <select
              value={selectedMessHall}
              onChange={(e) => onSelectMessHall?.(e.target.value)}
              className="w-full h-10 px-3 border border-[#74777f] rounded-lg text-[13px] text-[#0d1c2e] bg-white focus:border-[#002045] outline-none"
            >
              {halls.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          {/* Sound cue toggle */}
          <div className="flex items-center justify-between p-3 border border-[#c4c6cf]/60 rounded-xl">
            <div>
              <p className="text-[13px] font-bold text-[#0d1c2e]">Scanner Audio Chime</p>
              <p className="text-[11px] text-[#74777f]">Play audio beep upon token issue</p>
            </div>
            <button
              onClick={onToggleSound}
              type="button"
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                soundEnabled ? 'bg-[#0a6c44]' : 'bg-[#c4c6cf]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sign Out / Switch Account Button */}
          <button
            onClick={handleSignOut}
            type="button"
            className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out / Switch Account
          </button>

          <button
            onClick={onClose}
            type="button"
            className="w-full h-10 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg text-[13px] font-bold shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

