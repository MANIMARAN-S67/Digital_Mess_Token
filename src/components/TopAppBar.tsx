import React from 'react';

interface TopAppBarProps {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  onOpenProfile,
  onOpenNotifications,
  unreadCount = 2
}) => {
  return (
    <header className="fixed top-0 left-0 w-full h-[64px] z-50 flex justify-between items-center px-4 bg-[#f8f9ff] border-b border-[#c4c6cf]/60 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Account / Profile Button */}
      <button
        onClick={onOpenProfile}
        aria-label="Account"
        className="w-10 h-10 flex items-center justify-center -ml-1 text-[#002045] hover:bg-[#eff4ff] active:scale-95 transition-all duration-200 rounded-full"
      >
        <span className="material-symbols-outlined text-[26px]">account_circle</span>
      </button>

      {/* Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-[20px] font-semibold text-[#002045] tracking-tight font-sans">
          Mess Manager
        </h1>
        <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#9ff5c1] text-[#167249] rounded-full">
          Live
        </span>
      </div>

      {/* Notifications Button with Badge */}
      <button
        onClick={onOpenNotifications}
        aria-label="Notifications"
        className="relative w-10 h-10 flex items-center justify-center -mr-1 text-[#002045] hover:bg-[#eff4ff] active:scale-95 transition-all duration-200 rounded-full"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full ring-2 ring-[#f8f9ff]" />
        )}
      </button>
    </header>
  );
};
