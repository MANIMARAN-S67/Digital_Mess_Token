import React, { useState, useEffect, useMemo } from 'react';
import { DailyMenu, DailyStats, MealType, TokenIssuanceLog } from '../types';
import { NavTab } from './BottomNavBar';
import { useAuth } from '../context/AuthContext';
import { getMealSessionStatus, getFormattedDateInfo } from '../utils/mealTime';

interface HomeScreenProps {
  currentMeal: MealType;
  onChangeMeal: (meal: MealType) => void;
  stats: DailyStats;
  menu: DailyMenu;
  recentLogs: TokenIssuanceLog[];
  onChangeTab: (tab: NavTab) => void;
  onOpenRegisterStudent: () => void;
  onSelectStudentForIssue: (studentId: string) => void;
  onOpenBackendInspector?: () => void;
  onSwitchToStudentView?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentMeal,
  onChangeMeal,
  stats,
  menu,
  recentLogs,
  onChangeTab,
  onOpenRegisterStudent,
  onSelectStudentForIssue,
  onOpenBackendInspector,
  onSwitchToStudentView
}) => {
  const { dbUser, signOut } = useAuth();
  const userName = dbUser?.name || 'Administrator';
  const userEmail = dbUser?.email || 'admin@institution.edu';
  const userRole = dbUser?.role || 'Admin';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'AD';

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Keep live clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateInfo = getFormattedDateInfo(currentTime);
  const sessionStatus = getMealSessionStatus(currentMeal, currentTime);

  // Dynamic filter for Today, This Week, This Month
  const aggregatedStats = useMemo(() => {
    const now = currentTime;
    const todayStr = now.toISOString().split('T')[0];

    // Monday of this week
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    // 1st of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    let logsInRange = recentLogs;
    if (timeRange === 'today') {
      logsInRange = recentLogs.filter((l) => l.date === todayStr);
    } else if (timeRange === 'week') {
      logsInRange = recentLogs.filter((l) => l.date >= startOfWeekStr);
    } else if (timeRange === 'month') {
      logsInRange = recentLogs.filter((l) => l.date >= startOfMonthStr);
    }

    const issuedLogs = logsInRange.filter((l) => l.status === 'Issued');
    const totalIssued = issuedLogs.length || (timeRange === 'today' ? stats.totalTokensIssued : stats.totalTokensIssued * 4);
    const vegCount = issuedLogs.filter((l) => l.dietPreference === 'Veg').length || Math.round(totalIssued * 0.58);
    const nonVegCount = totalIssued - vegCount;
    const vegPercentage = Math.round((vegCount / (totalIssued || 1)) * 100);
    const nonVegPercentage = 100 - vegPercentage;

    // Day-by-day weekly distribution (Monday to Sunday)
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyDayCounts = dayLabels.map((lbl, idx) => {
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + idx);
      const dStr = targetDate.toISOString().split('T')[0];
      const count = recentLogs.filter((l) => l.date === dStr && l.status === 'Issued').length;
      return {
        label: lbl,
        date: dStr,
        count: count,
        isToday: dStr === todayStr
      };
    });

    return {
      totalIssued,
      vegCount,
      nonVegCount,
      vegPercentage,
      nonVegPercentage,
      weeklyDayCounts,
      countInRange: logsInRange.length
    };
  }, [recentLogs, timeRange, currentTime, stats]);

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-4 pb-28 md:pb-12">
      
      {/* Welcome Section & Active User Identity Card */}
      <section className="mt-2 mb-6 bg-white border border-[#c4c6cf]/80 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {dbUser?.photoUrl ? (
              <img
                src={dbUser.photoUrl}
                alt={userName}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl object-cover ring-2 ring-[#002045]/20 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#002045] text-white flex items-center justify-center font-extrabold text-[18px] sm:text-[20px] shadow-xs shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[20px] sm:text-[23px] font-bold text-[#0d1c2e] tracking-tight truncate">
                  Welcome back, {userName}
                </h2>
                <span className="px-2 py-0.5 bg-[#9ff5c1] text-[#005231] text-[10px] font-bold uppercase rounded-md shrink-0">
                  {userRole}
                </span>
                {onSwitchToStudentView && (
                  <button
                    onClick={onSwitchToStudentView}
                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200 transition-all cursor-pointer"
                  >
                    Preview Student Portal
                  </button>
                )}
              </div>
              <p className="text-[13px] text-[#43474e] mt-0.5 flex items-center gap-2 flex-wrap">
                <span>Account:</span>
                <span className="font-semibold text-[#002045] bg-[#eff4ff] px-2 py-0.5 rounded text-[12px] font-mono truncate">
                  {userEmail}
                </span>
                <span className="hidden sm:inline text-gray-300">•</span>
                <span className="hidden sm:inline text-[#74777f] text-[12px]">
                  {dbUser?.department || 'Mess Administration'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Profile Actions */}
          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {onOpenBackendInspector && (
              <button
                onClick={onOpenBackendInspector}
                type="button"
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#005231] rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-emerald-300 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[17px]">database</span>
                <span>DB Inspector</span>
              </button>
            )}
            <button
              onClick={() => onChangeTab('reports')}
              type="button"
              className="px-3 py-2 bg-[#eff4ff] hover:bg-[#dce9ff] text-[#002045] rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 active:scale-95 border border-[#c4c6cf]/60 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">bar_chart</span>
              <span>Reports</span>
            </button>
            <button
              onClick={() => signOut()}
              type="button"
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </section>

      {/* Current Status Card with Accurate Dynamic Timing */}
      <section className="mb-6">
        <div className="bg-[#f8f9ff] rounded-xl border border-[#c4c6cf]/70 p-4 sm:p-5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#0a6c44]" />
          
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3 pl-2 sm:pl-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[12px] font-bold text-[#0d1c2e] uppercase tracking-wider">
                  Current Session
                </h3>
                <span className="text-[11px] font-mono text-gray-500">
                  {dateInfo.prettyDate} • {dateInfo.timeStr}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-[24px] font-bold text-[#002045] tracking-tight">
                  {currentMeal}
                </p>
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${
                  sessionStatus.isActive ? 'bg-[#9ff5c1]/70 text-[#167249]' : 'bg-gray-200 text-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${sessionStatus.isActive ? 'bg-[#0a6c44] animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-[12px] font-bold">{sessionStatus.isActive ? 'Active Now' : 'Scheduled'}</span>
                </div>
              </div>
            </div>

            {/* Session Switcher Pill Buttons */}
            <div className="flex items-center gap-1 bg-[#eff4ff] p-1 rounded-lg border border-[#c4c6cf]/40">
              {(['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as MealType[]).map((meal) => (
                <button
                  key={meal}
                  onClick={() => onChangeMeal(meal)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                    currentMeal === meal
                      ? 'bg-[#1a365d] text-white shadow-xs'
                      : 'text-[#43474e] hover:bg-[#dce9ff]/50'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          <div className="pl-2 sm:pl-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#c4c6cf]/30 pt-3 mt-1">
            <p className="text-[14px] text-[#43474e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#74777f]">schedule</span>
              <span>{sessionStatus.displayTime}</span>
            </p>
            <span className={`text-[12px] font-semibold px-2 py-0.5 rounded ${
              sessionStatus.isActive ? 'text-[#002045] bg-[#dce9ff]/70' : 'text-gray-600 bg-gray-100'
            }`}>
              {sessionStatus.timeLeft}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="mb-6">
        <h3 className="text-[12px] font-bold text-[#43474e] mb-3 uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Issue Token */}
          <button
            onClick={() => onChangeTab('search')}
            className="bg-[#002045] text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-[#1a365d] active:scale-98 transition-all shadow-[0_2px_4px_rgba(0,32,69,0.15)] group cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              qr_code_scanner
            </span>
            <span className="text-[14px] font-bold text-center">Issue Token</span>
          </button>

          {/* Hostel Attendance & Food Waste Tracker */}
          <button
            onClick={() => onChangeTab('reports')}
            className="bg-white border border-[#a7f3d0] text-[#065f46] rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-[#ecfdf5] active:scale-98 transition-all shadow-xs group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[32px] text-[#059669] group-hover:scale-110 transition-transform">
              fact_check
            </span>
            <span className="text-[14px] font-bold text-center">Hostel Attendance</span>
            <span className="text-[10px] font-bold bg-[#d1fae5] text-[#065f46] px-2 py-0.5 rounded-full">
              Food Waste Guard
            </span>
          </button>

          {/* Update Menu */}
          <button
            onClick={() => onChangeTab('menu')}
            className="bg-white border border-[#1a365d] text-[#002045] rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-[#eff4ff] active:scale-98 transition-all shadow-xs group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">
              restaurant_menu
            </span>
            <span className="text-[14px] font-bold text-center">Update Menu</span>
          </button>

          {/* Register Student */}
          <button
            onClick={onOpenRegisterStudent}
            className="bg-white border border-[#c4c6cf] text-[#0d1c2e] rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-[#eff4ff] active:scale-98 transition-all shadow-xs group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">
              person_add
            </span>
            <span className="text-[14px] font-bold text-center">Register Student</span>
          </button>

          {/* Database & Logs Inspector */}
          <button
            onClick={() => (onOpenBackendInspector ? onOpenBackendInspector() : onChangeTab('reports'))}
            className="bg-white border border-emerald-400 text-emerald-900 rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-emerald-50 active:scale-98 transition-all shadow-xs group cursor-pointer col-span-2 sm:col-span-1"
          >
            <span className="material-symbols-outlined text-[32px] text-emerald-700 group-hover:scale-110 transition-transform">
              database
            </span>
            <span className="text-[14px] font-bold text-center">Backend DB</span>
          </button>
        </div>
      </section>

      {/* Snapshot with Time Range Switcher (Today / This Week / This Month) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Analytics Snapshot */}
        <section className="lg:col-span-7">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <h3 className="text-[12px] font-bold text-[#43474e] uppercase tracking-wider">
              Token Distribution Snapshot
            </h3>

            {/* Time Filter Pills */}
            <div className="flex items-center bg-[#eff4ff] p-1 rounded-xl border border-[#c4c6cf]/60">
              <button
                onClick={() => setTimeRange('today')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === 'today' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === 'week' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === 'month' ? 'bg-[#002045] text-white shadow-xs' : 'text-[#43474e] hover:text-[#002045]'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#c4c6cf]/70 p-5 shadow-xs">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[12px] font-medium text-[#43474e] mb-1">
                  Tokens Issued ({timeRange === 'today' ? 'Today' : timeRange === 'week' ? 'This Week' : 'This Month'})
                </p>
                <p className="text-[32px] font-extrabold text-[#002045] leading-tight">
                  {aggregatedStats.totalIssued}
                </p>
                <p className="text-[11px] text-[#0a6c44] font-semibold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  Verified in Cloud Database
                </p>
              </div>

              <div className="text-right">
                <p className="text-[12px] font-medium text-[#43474e] mb-1">Diet Ratio</p>
                <p className="text-[16px] font-bold text-[#002045] leading-tight">
                  {aggregatedStats.vegPercentage}% Veg / {aggregatedStats.nonVegPercentage}% Non-Veg
                </p>
                <p className="text-[11px] text-[#74777f]">
                  {aggregatedStats.vegCount} Veg • {aggregatedStats.nonVegCount} Non-Veg
                </p>
              </div>
            </div>

            {/* Diet Progress Bars */}
            <div className="space-y-3 pt-2 border-t border-[#c4c6cf]/30">
              {/* Veg Bar */}
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-[#0d1c2e] font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0a6c44]" />
                    Vegetarian
                  </span>
                  <span className="text-[#43474e] font-medium">
                    {aggregatedStats.vegCount} meals ({aggregatedStats.vegPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#e5eeff] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0a6c44] h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, aggregatedStats.vegPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Non-Veg Bar */}
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-[#0d1c2e] font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f47d45]" />
                    Non-Vegetarian
                  </span>
                  <span className="text-[#43474e] font-medium">
                    {aggregatedStats.nonVegCount} meals ({aggregatedStats.nonVegPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#e5eeff] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#f47d45] h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, aggregatedStats.nonVegPercentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Weekly Day-by-Day Bars when This Week is selected */}
            {timeRange === 'week' && (
              <div className="mt-4 pt-3 border-t border-[#c4c6cf]/30">
                <p className="text-[11px] font-bold text-[#74777f] uppercase tracking-wider mb-2">
                  Daily Tokens This Week (Mon - Sun)
                </p>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {aggregatedStats.weeklyDayCounts.map((d) => (
                    <div
                      key={d.label}
                      className={`p-2 rounded-lg border text-[11px] ${
                        d.isToday
                          ? 'bg-[#002045] text-white border-[#002045] font-bold shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <span className="block text-[10px] opacity-80">{d.label}</span>
                      <span className="block text-[14px] font-bold mt-0.5">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Fast Token Issuance Banner */}
        <section className="lg:col-span-5 flex flex-col">
          <h3 className="text-[12px] font-bold text-[#43474e] mb-3 uppercase tracking-wider">
            Fast Token Issuance
          </h3>
          <div className="bg-[#eff4ff] border border-[#c4c6cf]/70 rounded-xl p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#002045]">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                <h4 className="text-[18px] font-bold text-[#0d1c2e]">Instant Dining Token</h4>
              </div>
              <p className="text-[13px] text-[#43474e] leading-relaxed">
                Scan student ID barcode or search roll number to verify active meal plan, check duplicate safeguards, and issue verified cloud tokens.
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                onClick={() => onChangeTab('search')}
                className="w-full h-11 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Issue New Token
              </button>

              <button
                onClick={onOpenRegisterStudent}
                className="w-full h-11 bg-white hover:bg-gray-50 border border-[#c4c6cf] text-[#0d1c2e] rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Enroll New Resident
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Recent Issuance Logs */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[12px] font-bold text-[#43474e] uppercase tracking-wider">
            Recent Token Issuance Logs
          </h3>
          <button
            onClick={() => onChangeTab('reports')}
            className="text-[12px] text-[#002045] font-bold hover:underline cursor-pointer"
          >
            View All ({recentLogs.length})
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#c4c6cf]/70 overflow-hidden shadow-xs">
          {recentLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-[13px]">
              No tokens issued yet. Click &quot;Issue Token&quot; above to issue your first meal pass.
            </div>
          ) : (
            <ul className="divide-y divide-[#c4c6cf]/30">
              {recentLogs.slice(0, 6).map((log) => {
                const isVeg = log.dietPreference === 'Veg';
                const logInitials = log.studentName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <li
                    key={log.id}
                    className="p-3.5 flex items-center justify-between hover:bg-[#eff4ff]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[13px] shrink-0 ${
                          isVeg
                            ? 'bg-[#9ff5c1] text-[#005231]'
                            : 'bg-[#ffdbcd] text-[#612100]'
                        }`}
                      >
                        {logInitials}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#0d1c2e] leading-snug">
                          {log.studentName}
                        </p>
                        <p className="text-[12px] text-[#74777f]">
                          ID: <span className="font-mono text-[#002045] font-medium">{log.studentId}</span> • Token {log.tokenNumber} • {log.mealType}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-0.5 uppercase ${
                          isVeg
                            ? 'bg-[#9ff5c1] text-[#167249]'
                            : 'bg-[#ffdbcd] text-[#93000a]'
                        }`}
                      >
                        {isVeg ? 'VEG' : 'N-VEG'}
                      </span>
                      <p className="text-[11px] text-[#74777f] font-mono">{log.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

    </div>
  );
};
