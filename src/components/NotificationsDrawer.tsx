import React from 'react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: 'Current Session Ending Soon',
      desc: 'Lunch session will close in 45 minutes (02:30 PM). 842 tokens issued so far.',
      time: '10 mins ago',
      type: 'warning',
      icon: 'schedule'
    },
    {
      id: 2,
      title: 'Dinner Menu Published',
      desc: 'Chef Verma has approved the dinner menu: Aloo Gobi & Dal Makhani.',
      time: '1 hour ago',
      type: 'info',
      icon: 'restaurant_menu'
    },
    {
      id: 3,
      title: 'Ration Stock Notice',
      desc: 'Paneer inventory sufficient for 250 more servings. Butter supply restocked.',
      time: '3 hours ago',
      type: 'success',
      icon: 'inventory_2'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs animate-fadeIn">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col justify-between border-l border-[#c4c6cf]">
        <div>
          {/* Header */}
          <div className="p-4 bg-[#002045] text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <h3 className="text-[16px] font-bold">System Notifications</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-[#c4c6cf]/50 p-2">
            {notifications.map((item) => (
              <div key={item.id} className="p-3.5 hover:bg-[#eff4ff]/60 transition-colors rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#dce9ff] text-[#002045] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#0d1c2e]">{item.title}</p>
                    <p className="text-[12px] text-[#43474e] mt-0.5 leading-snug">{item.desc}</p>
                    <span className="text-[10px] text-[#74777f] font-mono mt-1 block">
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#c4c6cf]/60 bg-[#f8f9ff]">
          <button
            onClick={onClose}
            className="w-full h-10 border border-[#74777f] rounded-lg text-[13px] font-bold text-[#43474e] hover:bg-white transition-colors"
          >
            Mark All as Read
          </button>
        </div>
      </div>
    </div>
  );
};
