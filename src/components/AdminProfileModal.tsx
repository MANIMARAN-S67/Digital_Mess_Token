import React, { useState } from 'react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMessHall: string;
  onSelectMessHall: (hall: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  isOpen,
  onClose,
  selectedMessHall,
  onSelectMessHall,
  soundEnabled,
  onToggleSound
}) => {
  const [adminName] = useState('Chief Warden / Mess Secretary');
  const [adminEmail] = useState('mess.admin@institution.edu');

  if (!isOpen) return null;

  const halls = ['Central Mess Hall A', 'South Campus Mess B', 'Girls Hostel Diners C', 'Executive Dining D'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c4c6cf] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-[#002045] text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">account_circle</span>
            <h3 className="text-[17px] font-bold">Admin Profile &amp; Facility</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* User Card */}
          <div className="flex items-center gap-3 p-3 bg-[#eff4ff] rounded-xl border border-[#c4c6cf]/50">
            <div className="w-12 h-12 rounded-full bg-[#1a365d] text-white flex items-center justify-center font-bold text-[18px]">
              AD
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#0d1c2e]">{adminName}</p>
              <p className="text-[12px] text-[#43474e]">{adminEmail}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-[#9ff5c1] text-[#005231] text-[10px] font-bold uppercase rounded">
                Operational Staff
              </span>
            </div>
          </div>

          {/* Dining Facility Switcher */}
          <div>
            <label className="block text-[12px] font-bold text-[#43474e] uppercase mb-1.5">
              Assigned Dining Facility
            </label>
            <select
              value={selectedMessHall}
              onChange={(e) => onSelectMessHall(e.target.value)}
              className="w-full h-11 px-3 border border-[#74777f] rounded-lg text-[13px] text-[#0d1c2e] bg-white focus:border-[#002045] outline-none"
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

          {/* System Info */}
          <div className="text-[11px] text-[#74777f] space-y-1 pt-1">
            <p>System: Institutional Efficiency System v2.4</p>
            <p>Terminal ID: TM-ALPHA-08</p>
            <p>Status: All service nodes online (Lat: 12ms)</p>
          </div>

          <button
            onClick={onClose}
            className="w-full h-11 mt-2 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg text-[13px] font-bold shadow-xs transition-colors"
          >
            Save &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
};
