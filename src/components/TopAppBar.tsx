import React from 'react';
import { useAuth } from '../context/AuthContext';

interface TopAppBarProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  onOpenBackendInspector?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenProfile,
  onOpenNotifications,
  unreadCount = 2,
  onOpenBackendInspector
}) => {
  const { dbUser, signOut } = useAuth();
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

  return (
    <header className="fixed top-0 left-0 w-full h-[64px] z-50 flex justify-between items-center px-4 bg-[#f8f9ff] border-b border-[#c4c6cf]/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left: Branding & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#002045] flex items-center justify-center text-white shadow-xs">
          <span className="material-symbols-outlined text-[20px]">restaurant</span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-[19px] font-bold text-[#002045] tracking-tight font-sans">
            Mess Manager
          </h1>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#9ff5c1] text-[#167249] rounded-full">
            Live
          </span>
        </div>
      </div>

      {/* Right: DB Explorer, Notifications, User Profile & Direct Logout Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Database Inspector Button */}
        {onOpenBackendInspector && (
          <button
            onClick={onOpenBackendInspector}
            title="Inspect Firestore Backend Database & Activity Logs"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#005231] border border-emerald-300 rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">database</span>
            <span className="hidden sm:inline">DB Explorer</span>
          </button>
        )}

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          title="Notifications"
          className="relative w-9 h-9 flex items-center justify-center text-[#002045] hover:bg-[#eff4ff] active:scale-95 transition-all duration-200 rounded-full cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-[#f8f9ff]" />
          )}
        </button>

        {/* User Account / Profile Chip (Clickable to view full profile) */}
        <button
          onClick={onOpenProfile}
          type="button"
          title={`Click to view profile details for ${userName} (${userEmail})`}
          className="flex items-center gap-2.5 px-2.5 py-1.5 bg-white border border-[#c4c6cf]/80 hover:border-[#002045] rounded-xl hover:bg-[#eff4ff] transition-all text-left group shadow-xs active:scale-98"
        >
          {dbUser?.photoUrl ? (
            <img
              src={dbUser.photoUrl}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-300 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#1a365d] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
              {initials}
            </div>
          )}
          <div className="hidden sm:flex flex-col min-w-0 max-w-[160px]">
            <span className="text-[12px] font-bold text-[#0d1c2e] truncate leading-tight group-hover:text-[#002045]">
              {userName}
            </span>
            <span className="text-[10px] text-[#74777f] truncate leading-tight">
              {userEmail}
            </span>
          </div>
          <span className="hidden md:inline-block px-1.5 py-0.5 bg-[#dce9ff] text-[#002045] text-[10px] font-bold uppercase rounded">
            {userRole}
          </span>
        </button>

        {/* Dedicated Direct Logout Button */}
        <button
          onClick={() => signOut()}
          type="button"
          title="Log Out of your account"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-[12px] transition-all active:scale-95 shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="hidden xs:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};


