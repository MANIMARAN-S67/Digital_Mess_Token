import React from 'react';
import { NavTab } from './BottomNavBar';

interface DesktopSideNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenQuickIssue: () => void;
}

export const DesktopSideNav: React.FC<DesktopSideNavProps> = ({
  currentTab,
  onChangeTab,
  onOpenQuickIssue
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: 'dashboard', description: 'Dashboard & status' },
    { id: 'search' as NavTab, label: 'Search', icon: 'person_search', description: 'Scan & issue token' },
    { id: 'menu' as NavTab, label: 'Menu', icon: 'restaurant_menu', description: 'Daily meal offerings' },
    { id: 'reports' as NavTab, label: 'Reports', icon: 'analytics', description: 'Analytics & logs' }
  ];

  return (
    <aside className="hidden md:flex fixed top-[64px] left-0 w-[240px] h-[calc(100vh-64px)] bg-[#f8f9ff] border-r border-[#c4c6cf]/60 flex-col justify-between py-6 px-4 z-40">
      <div className="flex flex-col gap-2">
        <div className="px-3 mb-2">
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
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 text-left w-full ${
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
        <div className="mt-6 pt-4 border-t border-[#c4c6cf]/40 px-1">
          <button
            onClick={onOpenQuickIssue}
            className="w-full h-11 bg-[#002045] hover:bg-[#1a365d] text-white text-[13px] font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
            Fast Scan / Issue
          </button>
        </div>
      </div>

      {/* System Status in Sidebar Footer */}
      <div className="p-3 bg-[#eff4ff] border border-[#c4c6cf]/40 rounded-xl flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-[#0a6c44] animate-pulse shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[#0d1c2e] truncate">Central Mess Hall A</p>
          <p className="text-[11px] text-[#43474e] truncate">Current Session: Lunch</p>
        </div>
      </div>
    </aside>
  );
};
