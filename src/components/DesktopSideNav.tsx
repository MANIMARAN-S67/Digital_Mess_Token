import React from 'react';
import { NavTab } from './BottomNavBar';
import { useAuth } from '../context/AuthContext';

interface DesktopSideNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenQuickIssue: () => void;
  onOpenBackendInspector?: () => void;
}

export const DesktopSideNav: React.FC<DesktopSideNavProps> = ({
  currentTab,
  onChangeTab,
  onOpenQuickIssue,
  onOpenBackendInspector
}) => {
  const { dbUser, signOut } = useAuth();

  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: 'dashboard', description: 'Dashboard & status' },
    { id: 'search' as NavTab, label: 'Search', icon: 'person_search', description: 'Scan & issue token' },
    { id: 'menu' as NavTab, label: 'Menu', icon: 'restaurant_menu', description: 'Daily meal offerings' },
    { id: 'reports' as NavTab, label: 'Reports', icon: 'analytics', description: 'Analytics & logs' }
  ];

  const userName = dbUser?.name || 'Administrator';
  const userEmail = dbUser?.email || 'admin@institution.edu';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'AD';

  return (
    <aside className="hidden md:flex fixed top-[64px] left-0 w-[240px] h-[calc(100vh-64px)] bg-[#f8f9ff] border-r border-[#c4c6cf]/60 flex-col justify-between py-5 px-3 z-40">
      <div className="flex flex-col gap-1.5">
        <div className="px-3 mb-1">
          <p className="text-[11px] font-bold text-[#74777f] uppercase tracking-wider">
            Navigation
          </p>
        </div>

        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-left w-full ${
                isActive
                  ? 'bg-[#1a365d] text-white font-semibold shadow-xs'
                  : 'text-[#43474e] hover:bg-[#eff4ff] hover:text-[#002045]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${isActive ? 'filled' : ''}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
              <div className="flex flex-col">
                <span className="text-[14px] leading-tight">{tab.label}</span>
                <span
                  className={`text-[11px] leading-tight mt-0.5 ${
                    isActive ? 'text-[#adc7f7]' : 'text-[#74777f]'
                  }`}
                >
                  {tab.description}
                </span>
              </div>
            </button>
          );
        })}

        {/* Quick Action Button in Sidebar */}
        <div className="mt-4 pt-3 border-t border-[#c4c6cf]/40 px-1 space-y-2">
          <button
            onClick={onOpenQuickIssue}
            className="w-full h-10 bg-[#002045] hover:bg-[#1a365d] text-white text-[13px] font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            Fast Scan / Issue
          </button>

          {onOpenBackendInspector && (
            <button
              onClick={onOpenBackendInspector}
              className="w-full h-10 bg-emerald-50 hover:bg-emerald-100 text-[#005231] border border-emerald-300 text-[13px] font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">database</span>
              Backend Database
            </button>
          )}
        </div>
      </div>

      {/* Footer Area: User Profile Card & Sign Out */}
      <div className="flex flex-col gap-2 pt-3 border-t border-[#c4c6cf]/40">
        {/* User Card */}
        <div className="p-3 bg-white border border-[#c4c6cf]/70 rounded-xl flex flex-col gap-2 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {dbUser?.photoUrl ? (
              <img
                src={dbUser.photoUrl}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-300"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#1a365d] text-white flex items-center justify-center font-bold text-[12px] shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-[#0d1c2e] truncate">{userName}</p>
              <p className="text-[11px] text-[#74777f] truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            type="button"
            className="w-full h-8 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-98"
          >
            <span className="material-symbols-outlined text-[15px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>

        {/* System Status in Sidebar Footer */}
        <div className="p-2.5 bg-[#eff4ff] border border-[#c4c6cf]/40 rounded-xl flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#0a6c44] animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#0d1c2e] truncate">Central Mess Hall A</p>
            <p className="text-[10px] text-[#43474e] truncate">Session Active: Lunch</p>
          </div>
        </div>
      </div>
    </aside>
  );
};


