import React, { useState, useMemo } from 'react';
import { MealType, Student } from '../types';

interface SearchScreenProps {
  currentMeal: MealType;
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onIssueToken: (student: Student) => void;
  onResetStudentSession?: (studentId: string) => void;
  onOpenScanner: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  currentMeal,
  students,
  selectedStudentId,
  onSelectStudent,
  onIssueToken,
  onResetStudentSession,
  onOpenScanner
}) => {
  const [searchQuery, setSearchQuery] = useState(selectedStudentId || '21CS1004');
  const [isIssuing, setIsIssuing] = useState(false);

  // Sync selectedStudentId if changes externally
  React.useEffect(() => {
    if (selectedStudentId) {
      setSearchQuery(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Find currently matched student
  const activeStudent = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students.find((s) => s.id === '21CS1004') || students[0];

    const match = students.find(
      (s) =>
        s.id.toLowerCase() === q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
    return match || students.find((s) => s.id === '21CS1004') || students[0];
  }, [searchQuery, students]);

  // Check eligibility for currentMeal
  const alreadyIssuedInfo = activeStudent?.issuedSessionsToday?.[currentMeal];
  const isAlreadyIssued = Boolean(alreadyIssuedInfo);
  const isDeclined = activeStudent?.status === 'Fee Dues Pending' || activeStudent?.status === 'Plan Expired';
  const isEligible = !isAlreadyIssued && !isDeclined;

  const handleIssueClick = () => {
    if (!activeStudent || !isEligible) return;
    setIsIssuing(true);
    setTimeout(() => {
      onIssueToken(activeStudent);
      setIsIssuing(false);
    }, 350);
  };

  const isNonVeg = activeStudent?.preference === 'Non-Veg';

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-4 pb-28 md:pb-12">
      {/* Quick Switcher for Testing / Demonstration */}
      <div className="w-full max-w-md mx-auto mb-4 bg-[#eff4ff] p-2 rounded-xl border border-[#c4c6cf]/60">
        <p className="text-[11px] font-bold text-[#43474e] uppercase tracking-wider px-1 mb-1.5 flex items-center justify-between">
          <span>Quick Select Student</span>
          <span className="text-[#002045] font-normal">Switch profiles to test</span>
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {students.map((s) => {
            const hasIssued = Boolean(s.issuedSessionsToday?.[currentMeal]);
            const isSelected = activeStudent?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSearchQuery(s.id);
                  onSelectStudent(s.id);
                }}
                className={`px-2.5 py-1 text-[12px] font-medium rounded-lg shrink-0 transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#002045] text-white shadow-xs font-bold'
                    : 'bg-white text-[#0d1c2e] hover:bg-[#dce9ff] border border-[#c4c6cf]/50'
                }`}
              >
                <span>{s.name.split(' ')[0]}</span>
                {hasIssued && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" title="Already Issued" />
                )}
                {s.status === 'Fee Dues Pending' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f47d45]" title="Dues Pending" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Section */}
      <section className="mb-6">
        <div className="relative w-full max-w-md mx-auto">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#43474e] pointer-events-none">
            search
          </span>
          <input
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-12 bg-white rounded-lg border border-[#74777f] focus:border-[#002045] focus:ring-2 focus:ring-[#d6e3ff] outline-none text-[16px] text-[#0d1c2e] placeholder-[#43474e] transition-all shadow-xs"
            placeholder="Scan or enter Roll No. / Name..."
            type="text"
          />
          <button
            onClick={onOpenScanner}
            title="Scan QR / Barcode"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-[#002045] bg-[#e5eeff] rounded hover:bg-[#dce9ff] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </button>
        </div>
      </section>

      {/* Eligibility Status Banner */}
      {isEligible && (
        <div className="w-full max-w-md mx-auto bg-[#167249]/10 text-[#167249] border border-[#9ff5c1] rounded-lg p-2.5 mb-4 flex items-center gap-2.5 animate-fadeIn">
          <span className="material-symbols-outlined filled text-[#167249] text-[22px]">
            check_circle
          </span>
          <p className="font-bold text-[14px] flex-1">Eligible for {currentMeal}</p>
        </div>
      )}

      {isAlreadyIssued && (
        <div className="w-full max-w-md mx-auto bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a] rounded-lg p-2.5 mb-4 flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined filled text-[#ba1a1a] text-[22px]">
              error
            </span>
            <p className="font-bold text-[14px]">
              Already Issued Today at {alreadyIssuedInfo?.issuedAt || '12:45 PM'}
            </p>
          </div>
          {onResetStudentSession && (
            <button
              onClick={() => onResetStudentSession(activeStudent.id)}
              className="text-[11px] underline font-bold hover:text-black shrink-0"
              title="Admin Reset"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {isDeclined && (
        <div className="w-full max-w-md mx-auto bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a] rounded-lg p-2.5 mb-4 flex items-center gap-2.5 animate-fadeIn">
          <span className="material-symbols-outlined filled text-[#ba1a1a] text-[22px]">
            cancel
          </span>
          <div>
            <p className="font-bold text-[14px]">Token Denied: {activeStudent.status}</p>
            <p className="text-[12px] opacity-90">Hostel mess dues pending payment</p>
          </div>
        </div>
      )}

      {/* Student Details Card */}
      {activeStudent && (
        <section className="w-full max-w-md mx-auto bg-white border border-[#c4c6cf] rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col mb-6">
          {/* Meal Preference Bar */}
          <div
            className={`h-2 w-full ${isNonVeg ? 'bg-[#f47d45]' : 'bg-[#0a6c44]'}`}
          />

          <div className="p-4 flex flex-col gap-4">
            {/* Header: Name, Roll & Photo */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#dce9ff] border border-[#74777f]/40 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                <img
                  alt={activeStudent.name}
                  className="w-full h-full object-cover"
                  src={activeStudent.photoUrl}
                  onError={(e) => {
                    // Fallback to avatar if remote photo fails
                    (e.currentTarget as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        activeStudent.name
                      )}&background=1a365d&color=fff&size=128`;
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[20px] font-semibold text-[#0d1c2e] truncate">
                  {activeStudent.name}
                </h2>
                <p className="text-[16px] text-[#43474e] truncate font-mono">
                  {activeStudent.id}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-end">
                <span
                  className={`font-bold text-[14px] px-2.5 py-1 rounded tracking-wide ${
                    isNonVeg
                      ? 'bg-[#f47d45]/20 text-[#93000a]'
                      : 'bg-[#9ff5c1]/60 text-[#167249]'
                  }`}
                >
                  {activeStudent.preference}
                </span>
              </div>
            </div>

            <hr className="border-[#c4c6cf]/60 w-full" />

            {/* Meta Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-[#43474e] uppercase tracking-wider">
                  Department
                </span>
                <span className="text-[15px] text-[#0d1c2e] font-medium truncate">
                  {activeStudent.department}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-[#43474e] uppercase tracking-wider">
                  Hostel / Room
                </span>
                <span className="text-[15px] text-[#0d1c2e] font-medium truncate">
                  {activeStudent.hostelRoom}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-[#43474e] uppercase tracking-wider">
                  Current Meal
                </span>
                <span className="text-[15px] text-[#0d1c2e] font-medium truncate">
                  {currentMeal} (12:30 - 14:00)
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-[#43474e] uppercase tracking-wider">
                  Status
                </span>
                <div className="flex items-center gap-1.5 text-[#0a6c44]">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activeStudent.status === 'Active Plan' ? 'bg-[#0a6c44]' : 'bg-[#ba1a1a]'
                    }`}
                  />
                  <span className="text-[14px] font-bold">
                    {activeStudent.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Action Button Section */}
      <section className="w-full max-w-md mx-auto flex flex-col gap-3">
        {isEligible ? (
          <button
            onClick={handleIssueClick}
            disabled={isIssuing}
            className="w-full h-12 bg-[#002045] text-white font-semibold text-[18px] rounded-lg flex items-center justify-center gap-2 hover:bg-[#1a365d] active:scale-98 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            {isIssuing ? 'Issuing Token...' : 'Issue Token'}
          </button>
        ) : (
          <button
            disabled
            className="w-full h-12 bg-[#dce9ff] text-[#43474e] font-semibold text-[18px] rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
          >
            <span className="material-symbols-outlined text-[24px]">block</span>
            Issue Token
          </button>
        )}
      </section>

      {/* Structural Reference Example (matches Error State Example from provided template) */}
      <div className="w-full max-w-md mx-auto mt-8 pt-6 border-t border-[#c4c6cf]/40">
        <p className="text-[11px] font-bold text-[#74777f] uppercase tracking-wider mb-2 text-center">
          Reference: Duplicate Scan Safeguard
        </p>
        <div className="w-full bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a] rounded-lg p-2.5 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined filled text-[#ba1a1a]">error</span>
          <p className="font-bold text-[14px] flex-1">Already Issued Today at 12:45 PM</p>
        </div>
        <button
          disabled
          className="w-full h-12 bg-[#dce9ff] text-[#43474e] font-semibold text-[18px] rounded-lg flex items-center justify-center cursor-not-allowed opacity-60"
        >
          Issue Token
        </button>
      </div>
    </div>
  );
};
