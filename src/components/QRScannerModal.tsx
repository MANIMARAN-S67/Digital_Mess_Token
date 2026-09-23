import React, { useState } from 'react';
import { Student } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSelectScannedStudent: (studentId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  onSelectScannedStudent
}) => {
  const [manualCode, setManualCode] = useState('');

  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    onSelectScannedStudent(id);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSelect(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-[#c4c6cf] shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#002045] text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
            <h3 className="text-[17px] font-bold">Scan Student ID Card</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-5 flex flex-col items-center">
          {/* Simulated Camera Viewfinder */}
          <div className="relative w-64 h-64 bg-[#0d1c2e] rounded-xl overflow-hidden flex items-center justify-center shadow-inner border-2 border-[#1a365d]">
            {/* Viewfinder corner guides */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#9ff5c1]" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-[#9ff5c1]" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-[#9ff5c1]" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#9ff5c1]" />

            {/* Scanning Laser Animation */}
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#9ff5c1] to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_#9ff5c1]" />

            <div className="flex flex-col items-center gap-2 text-white/60 pointer-events-none">
              <span className="material-symbols-outlined text-[48px]">barcode_scanner</span>
              <span className="text-[12px] font-medium tracking-wide">
                Align barcode / QR inside frame
              </span>
            </div>
          </div>

          <p className="text-[13px] text-[#43474e] mt-4 text-center font-medium">
            Tap a student ID card below to simulate instant optical scanner input:
          </p>

          {/* Quick Clickable Student Barcodes */}
          <div className="w-full mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
            {students.map((student) => {
              const isNonVeg = student.preference === 'Non-Veg';
              return (
                <button
                  key={student.id}
                  onClick={() => handleSelect(student.id)}
                  className="w-full p-2.5 bg-[#f8f9ff] hover:bg-[#eff4ff] border border-[#c4c6cf]/60 rounded-lg flex items-center justify-between transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-8 rounded-full ${
                        isNonVeg ? 'bg-[#f47d45]' : 'bg-[#0a6c44]'
                      }`}
                    />
                    <div>
                      <p className="text-[14px] font-bold text-[#0d1c2e] group-hover:text-[#002045]">
                        {student.name}
                      </p>
                      <p className="text-[12px] font-mono text-[#74777f]">
                        Roll: {student.id} • {student.department}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-1 bg-white border border-[#c4c6cf] text-[#002045] font-mono text-[11px] font-bold rounded group-hover:bg-[#1a365d] group-hover:text-white transition-colors">
                    SCAN
                  </span>
                </button>
              );
            })}
          </div>

          {/* Manual Input Form */}
          <form
            onSubmit={handleManualSubmit}
            className="w-full mt-4 pt-3 border-t border-[#c4c6cf]/50 flex gap-2"
          >
            <input
              type="text"
              placeholder="Or enter Roll / Barcode ID..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 h-11 px-3 border border-[#74777f] rounded-lg text-[14px] text-[#0d1c2e] focus:border-[#002045] outline-none"
            />
            <button
              type="submit"
              className="h-11 px-4 bg-[#002045] text-white font-bold text-[13px] rounded-lg hover:bg-[#1a365d] transition-colors"
            >
              Verify
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
