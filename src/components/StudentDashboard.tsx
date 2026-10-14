import React, { useState, useEffect } from 'react';
import { MealType, DailyMenu, Student } from '../types';
import { TokenRecord, getStudentTokens, calculateStudentEatStats } from '../services/tokenService';
import { getMealSessionStatus, getFormattedDateInfo } from '../utils/mealTime';
import { useAuth } from '../context/AuthContext';

interface StudentDashboardProps {
  student: Student;
  currentMeal: MealType;
  menu: DailyMenu;
  onDeclareToken: (student: Student) => void;
  onViewTokenSlip: (tokenRecord: TokenRecord) => void;
  onSwitchToAdminView?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  currentMeal,
  menu,
  onDeclareToken,
  onViewTokenSlip,
  onSwitchToAdminView
}) => {
  const { signOut, dbUser } = useAuth();
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'all'>('week');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Keep live time ticking
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch student's personal token history
  const loadStudentTokens = async () => {
    setLoadingTokens(true);
    try {
      const records = await getStudentTokens(student.id);
      setTokens(records);
    } catch (e) {
      console.warn('Failed to fetch student tokens:', e);
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    loadStudentTokens();
  }, [student.id, student.issuedSessionsToday]);

  const dateInfo = getFormattedDateInfo(currentTime);
  const sessionStatus = getMealSessionStatus(currentMeal, currentTime);
  const eatStats = calculateStudentEatStats(tokens, student.id);

  // Check if token already claimed for current meal session today
  const existingTodaySession = student.issuedSessionsToday?.[currentMeal];
  const tokenForCurrentMeal = tokens.find(
    (t) => t.studentId === student.id && t.date === dateInfo.dateStr && t.mealType === currentMeal && t.status !== 'Cancelled'
  );
  const hasClaimedCurrentMeal = Boolean(existingTodaySession || tokenForCurrentMeal);
  const claimedTokenNumber = existingTodaySession?.tokenNumber || tokenForCurrentMeal?.tokenNumber || 'TKN-000';
  const claimedTime = existingTodaySession?.issuedAt || tokenForCurrentMeal?.time || '';

  const isNonVeg = student.preference === 'Non-Veg';
  const currentMenuData = menu[currentMeal]?.[isNonVeg ? 'nonVeg' : 'veg'];

  return (
    <div className="flex-1 w-full max-w-[1100px] mx-auto px-4 py-4 pb-28 md:pb-12 flex flex-col gap-6">
      
      {/* Student Welcome & Profile Banner */}
      <section className="bg-white border border-[#c4c6cf]/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative">
              <img
                src={
                  student.photoUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=002045&color=fff&size=128`
                }
                alt={student.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#002045]/20 shadow-xs"
              />
              <span
                className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md shadow-xs ${
                  isNonVeg ? 'bg-orange-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {student.preference}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[22px] font-bold text-[#0d1c2e] tracking-tight truncate">
                  {student.name}
                </h2>
                <span className="px-2 py-0.5 bg-[#9ff5c1] text-[#005231] text-[11px] font-bold rounded-md">
                  Active Dining Plan
                </span>
                {dbUser?.role !== 'Student' && onSwitchToAdminView && (
                  <button
                    onClick={onSwitchToAdminView}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold rounded-md border border-blue-200 transition-all cursor-pointer"
                  >
                    Switch to Admin View
                  </button>
                )}
              </div>
              <p className="text-[13px] text-[#43474e] mt-1 flex items-center gap-2 flex-wrap font-mono">
                <span className="font-bold text-[#002045] bg-[#eff4ff] px-2 py-0.5 rounded">
                  Roll ID: {student.id}
                </span>
                {student.academicYear && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded font-bold font-sans">
                      {student.academicYear}
                    </span>
                  </>
                )}
                <span className="text-gray-300">•</span>
                <span className="text-[#0d1c2e] font-sans">
                  {student.hostelRoom || 'Hostel Resident'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-[#74777f] font-sans">
                  {student.department || 'Academic Department'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            <button
              onClick={() => loadStudentTokens()}
              className="px-3 py-2 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#002045] rounded-xl text-[12px] font-bold flex items-center gap-1.5 border border-[#c4c6cf]/60 cursor-pointer active:scale-95"
            >
              <span className={`material-symbols-outlined text-[17px] ${loadingTokens ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Refresh</span>
            </button>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-[12px] font-bold flex items-center gap-1.5 border border-red-200 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Action Card: Declare Meal Token */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Token Claim & Session Status (2 cols on md) */}
        <div className="md:col-span-2 bg-[#f8f9ff] border-2 border-[#002045]/20 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#002045]" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-3 pl-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#002045] text-white flex items-center gap-1.5 shadow-xs">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                {currentMeal} Session
              </span>
              <span className="text-[12px] font-semibold text-[#005231] bg-[#9ff5c1]/60 px-2.5 py-0.5 rounded-md">
                {sessionStatus.timeLeft || sessionStatus.displayTime}
              </span>
            </div>

            <div className="pl-2">
              <h3 className="text-[20px] font-extrabold text-[#002045]">
                {hasClaimedCurrentMeal ? 'Token Claimed for This Session' : 'Ready to Dine? Claim Your Token'}
              </h3>
              <p className="text-[13px] text-[#43474e] mt-1">
                {hasClaimedCurrentMeal
                  ? `Your digital meal token #${claimedTokenNumber} is verified and ready to present at the mess hall counter.`
                  : `Declare your attendance for ${currentMeal} to generate your instant digital mess pass and record your meal in the cloud.`}
              </p>
            </div>

            {/* Menu Highlight */}
            {currentMenuData && (
              <div className="mt-4 pl-2 bg-white rounded-xl p-3 border border-[#c4c6cf]/60">
                <p className="text-[11px] font-bold text-[#74777f] uppercase tracking-wider mb-1">
                  On The Menu Today ({student.preference})
                </p>
                <p className="text-[14px] font-bold text-[#0d1c2e]">
                  {currentMenuData.mainItem || 'Standard Mess Thali'}
                  {currentMenuData.side1 ? ` + ${currentMenuData.side1}` : ''}
                  {currentMenuData.beverage ? ` + ${currentMenuData.beverage}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-5 pl-2">
            {hasClaimedCurrentMeal ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">Active Pass</span>
                    <span className="text-[18px] font-mono font-extrabold text-emerald-950">
                      {claimedTokenNumber}
                    </span>
                    {claimedTime && (
                      <span className="text-[11px] text-emerald-700 block mt-0.5">
                        Issued at {claimedTime}
                      </span>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-[32px] text-emerald-600">
                    check_circle
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (tokenForCurrentMeal) {
                      onViewTokenSlip(tokenForCurrentMeal);
                    } else {
                      onViewTokenSlip({
                        id: 'curr',
                        tokenNumber: claimedTokenNumber,
                        studentId: student.id,
                        studentName: student.name,
                        mealType: currentMeal,
                        dietPreference: student.preference,
                        date: dateInfo.dateStr,
                        time: claimedTime || dateInfo.timeStr,
                        status: 'Issued',
                        issuedByName: student.name,
                        source: 'Student_Self_Serve'
                      });
                    }
                  }}
                  className="px-5 py-3.5 bg-[#002045] hover:bg-[#1a365d] text-white font-bold rounded-xl text-[13px] flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">qr_code</span>
                  View Digital Pass
                </button>
              </div>
            ) : (
              <button
                onClick={() => onDeclareToken(student)}
                className="w-full py-4 bg-[#0a6c44] hover:bg-[#085233] text-white text-[15px] font-extrabold rounded-xl flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">confirmation_number</span>
                Declare &amp; Issue {currentMeal} Token
              </button>
            )}
          </div>
        </div>

        {/* Live Clock & Session Card (1 col on md) */}
        <div className="bg-white border border-[#c4c6cf]/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-[#74777f] uppercase tracking-wider">
                Live Institution Time
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-[26px] font-mono font-extrabold text-[#002045] tracking-tight">
              {dateInfo.timeStr}
            </div>
            <p className="text-[12px] text-[#43474e] mt-0.5">{dateInfo.prettyDate}</p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <span className="text-[11px] font-bold text-[#74777f] uppercase tracking-wider block mb-1">
              Active Meal Hours
            </span>
            <div className="space-y-1.5 text-[12px]">
              <div className={`flex justify-between ${currentMeal === 'Breakfast' ? 'font-bold text-[#002045]' : 'text-gray-500'}`}>
                <span>Breakfast:</span>
                <span>07:30 - 09:30</span>
              </div>
              <div className={`flex justify-between ${currentMeal === 'Lunch' ? 'font-bold text-[#002045]' : 'text-gray-500'}`}>
                <span>Lunch:</span>
                <span>12:00 - 14:30</span>
              </div>
              <div className={`flex justify-between ${currentMeal === 'Snacks' ? 'font-bold text-[#002045]' : 'text-gray-500'}`}>
                <span>Snacks:</span>
                <span>16:30 - 18:00</span>
              </div>
              <div className={`flex justify-between ${currentMeal === 'Dinner' ? 'font-bold text-[#002045]' : 'text-gray-500'}`}>
                <span>Dinner:</span>
                <span>19:30 - 22:00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "How Much You Eat" Diet & Nutrition Analytics Section */}
      <section className="bg-white border border-[#c4c6cf]/80 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[18px] font-bold text-[#0d1c2e]">How Much You Eat</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#eff4ff] text-[#002045] rounded-full border border-[#c4c6cf]">
                Dining Attendance Tracker
              </span>
            </div>
            <p className="text-[12px] text-[#43474e]">
              View how many tokens you have declared and consumed across today, this week, and this month.
            </p>
          </div>

          {/* Time Range Pills */}
          <div className="flex bg-[#eff4ff] p-1 rounded-xl border border-[#c4c6cf]/60">
            <button
              onClick={() => setSelectedRange('week')}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedRange === 'week' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setSelectedRange('month')}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedRange === 'month' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setSelectedRange('all')}
              className={`px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedRange === 'all' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#f8f9ff] border border-[#c4c6cf]/70 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#74777f] uppercase block">Today's Meals</span>
            <div className="text-[24px] font-extrabold text-[#002045] mt-1">
              {eatStats.todayCount} <span className="text-[14px] text-gray-400 font-normal">/ 4</span>
            </div>
            <span className="text-[11px] text-[#005231] font-semibold block mt-1">
              {eatStats.todayCount > 0 ? 'Dined today' : 'No meals claimed yet'}
            </span>
          </div>

          <div className="bg-[#f8f9ff] border border-[#c4c6cf]/70 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#74777f] uppercase block">This Week</span>
            <div className="text-[24px] font-extrabold text-[#002045] mt-1">
              {eatStats.weekCount} <span className="text-[14px] text-gray-400 font-normal">meals</span>
            </div>
            <span className="text-[11px] text-[#002045] font-semibold block mt-1">
              Mon - Sun cycle
            </span>
          </div>

          <div className="bg-[#f8f9ff] border border-[#c4c6cf]/70 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#74777f] uppercase block">This Month</span>
            <div className="text-[24px] font-extrabold text-[#002045] mt-1">
              {eatStats.monthCount} <span className="text-[14px] text-gray-400 font-normal">meals</span>
            </div>
            <span className="text-[11px] text-[#002045] font-semibold block mt-1">
              Calendar month
            </span>
          </div>

          <div className="bg-[#f8f9ff] border border-[#c4c6cf]/70 rounded-xl p-3.5">
            <span className="text-[11px] font-bold text-[#74777f] uppercase block">Total All-Time</span>
            <div className="text-[24px] font-extrabold text-[#002045] mt-1">
              {eatStats.totalCount} <span className="text-[14px] text-gray-400 font-normal">tokens</span>
            </div>
            <span className="text-[11px] text-[#005231] font-semibold block mt-1">
              Verified in Firestore
            </span>
          </div>
        </div>

        {/* Meal Type Breakdown */}
        <div className="bg-[#eff4ff]/60 border border-[#c4c6cf]/60 rounded-xl p-4">
          <h4 className="text-[12px] font-bold text-[#002045] uppercase tracking-wider mb-3">
            Meal Session Breakdown (Your Eating Habits)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-lg border border-[#c4c6cf]/60">
              <span className="text-[11px] font-medium text-gray-500 block">Breakfast</span>
              <span className="text-[18px] font-bold text-[#0d1c2e]">{eatStats.mealCounts.Breakfast} meals</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#c4c6cf]/60">
              <span className="text-[11px] font-medium text-gray-500 block">Lunch</span>
              <span className="text-[18px] font-bold text-[#0d1c2e]">{eatStats.mealCounts.Lunch} meals</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#c4c6cf]/60">
              <span className="text-[11px] font-medium text-gray-500 block">Snacks</span>
              <span className="text-[18px] font-bold text-[#0d1c2e]">{eatStats.mealCounts.Snacks} meals</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[#c4c6cf]/60">
              <span className="text-[11px] font-medium text-gray-500 block">Dinner</span>
              <span className="text-[18px] font-bold text-[#0d1c2e]">{eatStats.mealCounts.Dinner} meals</span>
            </div>
          </div>
        </div>
      </section>

      {/* Student Token History Ledger */}
      <section className="bg-white border border-[#c4c6cf]/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-[16px] font-bold text-[#0d1c2e]">Your Declared Tokens History</h3>
            <p className="text-[12px] text-[#43474e]">
              Chronological ledger of meal passes issued to your account.
            </p>
          </div>
          <span className="text-[12px] font-mono font-bold text-[#002045] bg-[#eff4ff] px-2.5 py-1 rounded-lg">
            {tokens.length} Total Passes
          </span>
        </div>

        {tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-[13px] bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No meal tokens claimed yet. Declare your first token above!
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Pass / Token #</th>
                  <th className="p-2.5">Meal</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Diet</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tokens.slice(0, 15).map((t) => (
                  <tr key={t.id} className="hover:bg-blue-50/50">
                    <td className="p-2.5 font-mono font-bold text-[#002045]">{t.tokenNumber}</td>
                    <td className="p-2.5 font-semibold">{t.mealType}</td>
                    <td className="p-2.5 font-mono">{t.date}</td>
                    <td className="p-2.5 font-mono text-gray-500">{t.time}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.dietPreference === 'Veg'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {t.dietPreference}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'Issued'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => onViewTokenSlip(t)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#eff4ff] hover:bg-[#002045] hover:text-white text-[#002045] rounded-md transition-all cursor-pointer"
                      >
                        Pass Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
};
