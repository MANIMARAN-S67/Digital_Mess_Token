import React from 'react';
import { MealType, Student } from '../types';

interface TokenSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  mealType: MealType;
  tokenNumber: string;
  issuedAt: string;
}

export const TokenSlipModal: React.FC<TokenSlipModalProps> = ({
  isOpen,
  onClose,
  student,
  mealType,
  tokenNumber,
  issuedAt
}) => {
  if (!isOpen || !student) return null;

  const isNonVeg = student.preference === 'Non-Veg';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c4c6cf] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col">
        {/* Top colored indicator band */}
        <div className={`h-3 w-full ${isNonVeg ? 'bg-[#f47d45]' : 'bg-[#0a6c44]'}`} />

        <div className="p-6 flex flex-col items-center text-center">
          {/* Institution Header */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[#002045] text-[20px]">
              local_dining
            </span>
            <span className="text-[12px] font-bold text-[#002045] tracking-wider uppercase">
              Mess Manager • Token Pass
            </span>
          </div>

          <p className="text-[12px] text-[#74777f]">Central Dining Facility</p>

          {/* Token Display (Matching Design System token-number typography) */}
          <div className="my-5 p-4 bg-[#f8f9ff] rounded-xl border border-[#c4c6cf]/60 w-full flex flex-col items-center">
            <span className="text-[11px] font-bold text-[#74777f] uppercase tracking-wider">
              Token Number
            </span>
            <span className="text-[44px] font-extrabold text-[#002045] tracking-widest my-1 font-mono">
              {tokenNumber}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 bg-[#dce9ff] text-[#002045] text-[12px] font-bold rounded">
                {mealType}
              </span>
              <span
                className={`px-2.5 py-0.5 text-[12px] font-bold rounded ${
                  isNonVeg
                    ? 'bg-[#ffdbcd] text-[#93000a]'
                    : 'bg-[#9ff5c1] text-[#005231]'
                }`}
              >
                {student.preference}
              </span>
            </div>
          </div>

          {/* Student Info Snippet */}
          <div className="w-full text-left bg-white p-3 border border-[#c4c6cf]/50 rounded-lg text-[13px] space-y-1 mb-4">
            <div className="flex justify-between">
              <span className="text-[#74777f]">Student Name:</span>
              <strong className="text-[#0d1c2e]">{student.name}</strong>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-[#74777f]">Roll No:</span>
              <strong className="text-[#002045]">{student.id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#74777f]">Hostel / Room:</span>
              <span className="text-[#0d1c2e]">{student.hostelRoom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#74777f]">Timestamp:</span>
              <span className="text-[#0d1c2e] font-mono">{issuedAt}</span>
            </div>
          </div>

          {/* Barcode Simulation */}
          <div className="w-full flex flex-col items-center gap-1 pt-1 pb-3">
            <div className="h-10 w-4/5 flex justify-center items-end gap-1 opacity-80">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 2, 3, 2, 4, 1, 2, 3].map((w, i) => (
                <div
                  key={i}
                  className="bg-[#0d1c2e] h-full"
                  style={{ width: `${w * 2}px` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-[#74777f] tracking-widest">
              *{student.id}-{tokenNumber}*
            </span>
          </div>

          {/* Action buttons */}
          <div className="w-full grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={handlePrint}
              className="h-11 border border-[#002045] text-[#002045] font-bold text-[13px] rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#eff4ff] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Slip
            </button>
            <button
              onClick={onClose}
              className="h-11 bg-[#002045] text-white font-bold text-[13px] rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#1a365d] transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
