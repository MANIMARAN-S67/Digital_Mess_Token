import React from 'react';

export type NavTab = 'home' | 'search' | 'menu' | 'reports';

interface BottomNavBarProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Home', icon: 'dashboard' },
    { id: 'search' as NavTab, label: 'Search', icon: 'person_search' },
    { id: 'menu' as NavTab, label: 'Menu', icon: 'restaurant_menu' },
    { id: 'reports' as NavTab, label: 'Reports', icon: 'analytics' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-[72px] px-2 pb-safe bg-[#f8f9ff] border-t border-[#c4c6cf]/60 shadow-[0_-2px_6px_rgba(0,0,0,0.03)] md:hidden">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            aria-label={tab.label}
            className={`flex flex-col items-center justify-center px-3 py-1 transition-all duration-200 active:scale-95 ${
              isActive ? 'text-[#1a365d]' : 'text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <div
              className={`flex items-center justify-center px-4 py-1 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-[#1a365d] text-white shadow-xs'
                  : 'hover:bg-[#dce9ff]/40 text-[#43474e]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${isActive ? 'filled' : ''}`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {tab.icon}
              </span>
            </div>
            <span
              className={`text-[12px] mt-1 ${
                isActive ? 'font-bold text-[#1a365d]' : 'font-medium text-[#43474e]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
