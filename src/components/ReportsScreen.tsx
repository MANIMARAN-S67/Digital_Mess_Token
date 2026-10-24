import React, { useState, useMemo } from 'react';
import { DailyStats, MealType, TokenIssuanceLog, MessUserRecord, Student } from '../types';

interface ReportsScreenProps {
  stats: DailyStats;
  logs: TokenIssuanceLog[];
  messUsers?: MessUserRecord[];
  students?: Student[];
  currentMeal?: MealType;
  onIssueToken?: (student: Student) => Promise<void> | void;
  onSelectStudentForIssue?: (studentId: string) => void;
  onChangeTab?: (tab: any) => void;
  initialView?: 'overview' | 'hostelAttendance' | 'staffActivity';
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  stats,
  logs,
  messUsers = [],
  students = [],
  currentMeal,
  onIssueToken,
  onSelectStudentForIssue,
  onChangeTab,
  initialView = 'overview'
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'hostelAttendance' | 'staffActivity'>(initialView);
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>('All Meals');
  const [isFullLogExpanded, setIsFullLogExpanded] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Hostel Attendance specific filters
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [attendanceDietFilter, setAttendanceDietFilter] = useState<'all' | 'Veg' | 'Non-Veg'>('all');
  const [attendanceBlockFilter, setAttendanceBlockFilter] = useState<string>('all');
  const [issuingStudentId, setIssuingStudentId] = useState<string | null>(null);
  const [quickIssueToast, setQuickIssueToast] = useState<string | null>(null);

  // Date matching helper
  const isDateMatch = (logDate: string, selDate: string) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    if (selDate === 'Today') return logDate === todayStr;
    if (selDate === 'Yesterday') return logDate === yesterdayStr;
    if (selDate === 'This Week') return logDate >= startOfWeekStr;
    if (selDate === 'This Month') return logDate >= startOfMonthStr;
    return true; // 'All Time'
  };

  // Filter logs based on meal filter AND selectedDate
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Meal filter
      if (selectedMealFilter !== 'All Meals' && log.mealType !== selectedMealFilter) {
        return false;
      }
      // 2. Date filter
      return isDateMatch(log.date, selectedDate);
    });
  }, [logs, selectedMealFilter, selectedDate]);

  const displayedLogs = isFullLogExpanded ? filteredLogs : filteredLogs.slice(0, 8);

  // Filter mess users
  const filteredStaff = useMemo(() => {
    if (!staffSearchQuery.trim()) return messUsers;
    const q = staffSearchQuery.toLowerCase();
    return messUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
    );
  }, [messUsers, staffSearchQuery]);

  // Consolidate full hostel roster (students + any unique student in logs)
  const hostelResidents = useMemo(() => {
    const map = new Map<string, Student>();
    (students || []).forEach((s) => map.set(s.id, s));

    logs.forEach((log) => {
      if (!map.has(log.studentId)) {
        map.set(log.studentId, {
          id: log.studentId,
          name: log.studentName,
          academicYear: 'Hostel Resident',
          department: 'Hostel Student',
          hostelRoom: 'BH-1 / 101',
          preference: log.dietPreference,
          status: 'Active Plan',
          photoUrl: '',
          issuedSessionsToday: {}
        });
      }
    });

    return Array.from(map.values());
  }, [students, logs]);

  // Automated Hostel Attendance calculation based on tokens
  const attendanceRoster = useMemo(() => {
    return hostelResidents.map((student) => {
      // 1. Check matching logs for selected date and meal
      const matchingLogs = logs.filter((l) => {
        if (l.studentId !== student.id || l.status !== 'Issued') return false;
        if (!isDateMatch(l.date, selectedDate)) return false;
        if (selectedMealFilter !== 'All Meals' && l.mealType !== selectedMealFilter) return false;
        return true;
      });

      // 2. Check student's issuedSessionsToday if date is 'Today'
      let sessionToday: { tokenId?: string; tokenNumber: string; issuedAt: string; timestamp: number } | undefined;
      let sessionMealKey: MealType | undefined;

      if (selectedDate === 'Today' && student.issuedSessionsToday) {
        if (selectedMealFilter !== 'All Meals') {
          sessionToday = student.issuedSessionsToday[selectedMealFilter as MealType];
          sessionMealKey = selectedMealFilter as MealType;
        } else {
          const keys = Object.keys(student.issuedSessionsToday) as MealType[];
          if (keys.length > 0) {
            sessionMealKey = keys[0];
            sessionToday = student.issuedSessionsToday[sessionMealKey];
          }
        }
      }

      const isPresent = matchingLogs.length > 0 || Boolean(sessionToday);
      const tokenNumber = matchingLogs[0]?.tokenNumber || sessionToday?.tokenNumber || '';
      const issuedAt = matchingLogs[0]?.time || sessionToday?.issuedAt || '';
      const mealType =
        matchingLogs[0]?.mealType ||
        sessionMealKey ||
        (selectedMealFilter !== 'All Meals' ? selectedMealFilter : currentMeal || 'Lunch');

      // Parse room and block
      let block = 'Hostel';
      let room = '-';
      if (student.hostelRoom) {
        const parts = student.hostelRoom.split('/');
        if (parts.length > 1) {
          block = parts[0].trim();
          room = parts[1].trim();
        } else {
          block = student.hostelRoom.trim();
        }
      }

      return {
        student,
        isPresent,
        tokenNumber,
        issuedAt,
        mealType,
        dietPreference: student.preference || 'Veg',
        hostelBlock: block,
        roomNumber: room
      };
    });
  }, [hostelResidents, logs, selectedDate, selectedMealFilter, currentMeal]);

  // Aggregate Attendance & Food Waste Metrics
  const totalResidents = attendanceRoster.length;
  const presentStudents = attendanceRoster.filter((r) => r.isPresent);
  const absentStudents = attendanceRoster.filter((r) => !r.isPresent);

  const presentCount = presentStudents.length;
  const absentCount = absentStudents.length;

  const presentVeg = presentStudents.filter((r) => r.dietPreference === 'Veg').length;
  const presentNonVeg = presentStudents.filter((r) => r.dietPreference === 'Non-Veg').length;

  const absentVeg = absentStudents.filter((r) => r.dietPreference === 'Veg').length;
  const absentNonVeg = absentStudents.filter((r) => r.dietPreference === 'Non-Veg').length;

  const totalVegDemand = presentVeg + absentVeg;
  const totalNonVegDemand = presentNonVeg + absentNonVeg;

  const attendancePercent = totalResidents > 0 ? Math.round((presentCount / totalResidents) * 100) : 0;
  const foodPortionsSaved = absentCount;
  const estWasteKgsPrevented = (absentCount * 0.42).toFixed(1);

  // Available unique blocks for filter dropdown
  const availableBlocks = useMemo(() => {
    const blocks = new Set<string>();
    attendanceRoster.forEach((r) => {
      if (r.hostelBlock && r.hostelBlock !== 'Hostel') {
        blocks.add(r.hostelBlock);
      }
    });
    return Array.from(blocks).sort();
  }, [attendanceRoster]);

  // Filtered attendance list for display
  const filteredAttendanceRoster = useMemo(() => {
    return attendanceRoster.filter((r) => {
      // 1. Status filter
      if (attendanceStatusFilter === 'present' && !r.isPresent) return false;
      if (attendanceStatusFilter === 'absent' && r.isPresent) return false;

      // 2. Diet filter
      if (attendanceDietFilter !== 'all' && r.dietPreference !== attendanceDietFilter) return false;

      // 3. Block filter
      if (attendanceBlockFilter !== 'all' && r.hostelBlock !== attendanceBlockFilter) return false;

      // 4. Search query
      if (attendanceSearchQuery.trim()) {
        const q = attendanceSearchQuery.toLowerCase();
        const matchName = r.student.name.toLowerCase().includes(q);
        const matchId = r.student.id.toLowerCase().includes(q);
        const matchDept = (r.student.department || '').toLowerCase().includes(q);
        const matchBlock = r.hostelBlock.toLowerCase().includes(q);
        const matchRoom = r.roomNumber.toLowerCase().includes(q);
        const matchToken = r.tokenNumber.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDept && !matchBlock && !matchRoom && !matchToken) {
          return false;
        }
      }

      return true;
    });
  }, [attendanceRoster, attendanceStatusFilter, attendanceDietFilter, attendanceBlockFilter, attendanceSearchQuery]);

  // Quick Token Issuance directly from the Absent list
  const handleQuickIssue = async (student: Student) => {
    if (onIssueToken) {
      try {
        setIssuingStudentId(student.id);
        await onIssueToken(student);
        setQuickIssueToast(`Pass issued for ${student.name}! Automatically marked as Present.`);
        setTimeout(() => setQuickIssueToast(null), 4000);
      } catch (err: any) {
        alert(err?.message || 'Failed to issue token');
      } finally {
        setIssuingStudentId(null);
      }
    } else if (onSelectStudentForIssue) {
      onSelectStudentForIssue(student.id);
    }
  };

  // Export CSV handler for Token Logs
  const handleExportCSV = () => {
    const headers = [
      'Time',
      'Date',
      'Token Number',
      'Student ID',
      'Student Name',
      'Meal Type',
      'Diet Preference',
      'Issued By Staff',
      'Status',
      'Decline Reason'
    ];
    const rows = filteredLogs.map((log) => [
      `"${log.time}"`,
      `"${log.date}"`,
      `"${log.tokenNumber}"`,
      `"${log.studentId}"`,
      `"${log.studentName}"`,
      `"${log.mealType}"`,
      `"${log.dietPreference}"`,
      `"${log.issuedByName || 'Mess Counter Staff'}"`,
      `"${log.status}"`,
      `"${log.declineReason || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mess_tokens_${selectedDate.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export CSV handler for Hostel Attendance & Food Waste
  const handleExportAttendanceCSV = () => {
    const headers = [
      'Student ID',
      'Student Name',
      'Academic Year',
      'Department',
      'Hostel Block',
      'Room Number',
      'Diet Preference',
      'Meal Session',
      'Date Filter',
      'Attendance Status',
      'Token Number',
      'Token Issued At',
      'Kitchen Food Preparation Action'
    ];
    const rows = filteredAttendanceRoster.map((r) => [
      `"${r.student.id}"`,
      `"${r.student.name}"`,
      `"${r.student.academicYear || ''}"`,
      `"${r.student.department || ''}"`,
      `"${r.hostelBlock}"`,
      `"${r.roomNumber}"`,
      `"${r.dietPreference}"`,
      `"${r.mealType}"`,
      `"${selectedDate}"`,
      `"${r.isPresent ? 'Present (Token Issued)' : 'Absent (Token Pending)'}"`,
      `"${r.tokenNumber || 'N/A'}"`,
      `"${r.issuedAt || 'N/A'}"`,
      `"${r.isPresent ? `1x ${r.dietPreference} Meal Served` : `Hold 1x ${r.dietPreference} Meal (Food Waste Prevented)`}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `hostel_attendance_${selectedMealFilter.replace(/\s+/g, '_')}_${selectedDate.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic calculations based on state and filtered logs
  const totalCount = filteredLogs.length || stats.totalTokensIssued;
  const vegCountFiltered = filteredLogs.filter((l) => l.dietPreference === 'Veg').length;
  const nonVegCountFiltered = filteredLogs.filter((l) => l.dietPreference === 'Non-Veg').length;
  const vegPct =
    filteredLogs.length > 0
      ? Math.round((vegCountFiltered / (vegCountFiltered + nonVegCountFiltered || 1)) * 100)
      : Math.round((stats.vegCount / (stats.vegCount + stats.nonVegCount || 1)) * 100);
  const nonVegPct = 100 - vegPct;

  // Donut chart calculations
  const attendanceRate =
    filteredLogs.length > 0
      ? Math.min(100, Math.round((filteredLogs.length / (stats.totalEligible || 120)) * 100))
      : stats.attendanceRate || 85;
  const strokeDashoffset = 251.3 - (251.3 * attendanceRate) / 100;

  // Staff summary calculations
  const totalActiveStaff = messUsers.filter((u) => u.isActive !== false).length;
  const totalTokensIssuedTodayByStaff = messUsers.reduce((acc, u) => acc + (u.tokensIssuedToday || 0), 0);

  return (
    <div className="flex-1 w-full max-w-[1240px] mx-auto px-4 py-4 pb-28 md:pb-12 flex flex-col gap-6">
      {/* Header and View Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[24px] font-semibold text-[#0d1c2e] tracking-tight">
              Reports &amp; Activity
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eff4ff] text-[#002045] border border-[#c4c6cf]">
              Salesforce Live
            </span>
          </div>
          <p className="text-[14px] text-[#43474e] mt-0.5">
            Real-time token analytics, automated hostel meal attendance, and food waste prevention.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-[#eff4ff] p-1 rounded-xl border border-[#c4c6cf]/60 shadow-2xs overflow-x-auto">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'overview'
                ? 'bg-[#002045] text-white shadow-xs'
                : 'text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            Tokens &amp; Meals
          </button>

          <button
            onClick={() => setActiveView('hostelAttendance')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'hostelAttendance'
                ? 'bg-[#002045] text-white shadow-xs'
                : 'text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            Hostel Attendance &amp; Waste
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                activeView === 'hostelAttendance'
                  ? 'bg-[#9ff5c1] text-[#0a6c44]'
                  : 'bg-[#e5eeff] text-[#002045]'
              }`}
            >
              {presentCount}/{totalResidents} Present
            </span>
          </button>

          <button
            onClick={() => setActiveView('staffActivity')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'staffActivity'
                ? 'bg-[#002045] text-white shadow-xs'
                : 'text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Staff Logins &amp; Issuers ({messUsers.length})
          </button>
        </div>
      </div>

      {/* QUICK TOAST NOTIFICATION */}
      {quickIssueToast && (
        <div className="bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-[#059669]">check_circle</span>
            <span className="text-[13px] font-semibold">{quickIssueToast}</span>
          </div>
          <button
            onClick={() => setQuickIssueToast(null)}
            className="text-[#059669] hover:text-[#065f46] text-[18px] font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* VIEW 1: TOKENS & MEALS OVERVIEW */}
      {activeView === 'overview' && (
        <>
          {/* Smart Banner linking to Hostel Attendance & Food Waste */}
          <div className="bg-gradient-to-r from-[#eff4ff] via-[#f0fdf4] to-[#f8f9ff] border border-[#bbf7d0] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[22px]">eco</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[14px] font-bold text-[#0d1c2e]">
                    Hostel Meal Attendance &amp; Food Waste Guard Active
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#d1fae5] text-[#065f46]">
                    {presentCount} Present • {absentCount} Absent
                  </span>
                </div>
                <p className="text-[12px] text-[#43474e] mt-0.5">
                  Students with tokens are automatically marked Present; absent students are flagged so kitchen avoids cooking surplus portions.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveView('hostelAttendance')}
              className="px-3.5 py-2 bg-[#002045] hover:bg-[#1a365d] active:scale-95 text-white text-[12px] font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              View Attendance &amp; Waste Roster
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-2.5 items-center justify-end">
            <div className="relative min-w-[150px]">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-10 pl-3.5 pr-9 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[13px] font-medium appearance-none focus:outline-none focus:border-[#002045]"
              >
                <option>Today</option>
                <option>Yesterday</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>All Time</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#43474e] text-[18px]">
                calendar_today
              </span>
            </div>

            <div className="relative min-w-[130px]">
              <select
                value={selectedMealFilter}
                onChange={(e) => setSelectedMealFilter(e.target.value)}
                className="w-full h-10 pl-3.5 pr-9 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[13px] font-medium appearance-none focus:outline-none focus:border-[#002045]"
              >
                <option>All Meals</option>
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Snacks</option>
                <option>Dinner</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#43474e] text-[18px]">
                filter_list
              </span>
            </div>
          </div>

          {/* Bento Grid Stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Total Attendance Donut Gauge */}
            <div className="md:col-span-5 lg:col-span-4 bg-white border border-[#c4c6cf] rounded-xl p-5 flex flex-col items-center justify-between relative overflow-hidden shadow-xs">
              <div className="w-full flex justify-between items-center mb-2">
                <h3 className="text-[12px] font-bold text-[#43474e] uppercase tracking-wider text-left">
                  Total Attendance
                </h3>
                <span className="text-[11px] text-[#0a6c44] font-bold bg-[#9ff5c1]/60 px-2 py-0.5 rounded">
                  Goal: 80%
                </span>
              </div>

              <div className="relative w-40 h-40 flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke="#e5eeff" strokeWidth="12" />
                  <circle
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="40"
                    stroke="#1a365d"
                    strokeDasharray="251.3"
                    strokeDashoffset={strokeDashoffset}
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[32px] font-extrabold text-[#002045] leading-none">
                    {attendanceRate}%
                  </span>
                  <span className="text-[12px] font-medium text-[#43474e] mt-1">
                    {totalCount} / {stats.totalEligible}
                  </span>
                </div>
              </div>

              <p className="text-[13px] text-[#0a6c44] font-semibold flex items-center gap-1 w-full justify-center pt-2 border-t border-[#c4c6cf]/30">
                <span className="material-symbols-outlined text-[18px]">trending_up</span>
                Verified Digital Meal Passes
              </p>
            </div>

            {/* Dietary Distribution */}
            <div className="md:col-span-7 lg:col-span-8 bg-white border border-[#c4c6cf] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[12px] font-bold text-[#43474e] uppercase tracking-wider">
                    Dietary Distribution
                  </h3>
                  <span className="text-[12px] text-[#43474e]">
                    Filtered: <strong className="text-[#002045]">{selectedMealFilter}</strong>
                  </span>
                </div>

                <div className="flex flex-col justify-center gap-5 mt-3">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#059669]" />
                        <span className="font-bold text-[14px] text-[#0d1c2e]">Vegetarian</span>
                      </div>
                      <span className="font-bold text-[14px] text-[#0d1c2e]">
                        {vegPct}% ({vegCountFiltered || stats.vegCount})
                      </span>
                    </div>
                    <div className="w-full bg-[#e5eeff] h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-[#059669] h-full rounded-full transition-all duration-700"
                        style={{ width: `${vegPct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#ea580c]" />
                        <span className="font-bold text-[14px] text-[#0d1c2e]">Non-Vegetarian</span>
                      </div>
                      <span className="font-bold text-[14px] text-[#0d1c2e]">
                        {nonVegPct}% ({nonVegCountFiltered || stats.nonVegCount})
                      </span>
                    </div>
                    <div className="w-full bg-[#e5eeff] h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-[#ea580c] h-full rounded-full transition-all duration-700"
                        style={{ width: `${nonVegPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-[#c4c6cf]/30">
                <div className="bg-[#eff4ff] p-3 rounded-lg text-center">
                  <p className="text-[11px] text-[#43474e] uppercase font-semibold">Veg Buffer</p>
                  <p className="text-[16px] font-bold text-[#0a6c44]">
                    +{Math.max(0, stats.vegTarget - (vegCountFiltered || stats.vegCount))} Meals
                  </p>
                </div>
                <div className="bg-[#eff4ff] p-3 rounded-lg text-center">
                  <p className="text-[11px] text-[#43474e] uppercase font-semibold">Non-Veg Buffer</p>
                  <p className="text-[16px] font-bold text-[#c05621]">
                    +{Math.max(0, stats.nonVegTarget - (nonVegCountFiltered || stats.nonVegCount))} Meals
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* History Log Table with "Issued By Staff" */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl shadow-xs overflow-hidden mt-1">
            <div className="p-4 sm:p-5 border-b border-[#c4c6cf] flex justify-between items-center bg-[#ffffff]">
              <div>
                <h3 className="text-[18px] font-bold text-[#0d1c2e]">Token Issuance History</h3>
                <p className="text-[12px] text-[#43474e]">
                  Shows verified meal tokens and the specific staff member who issued each pass.
                </p>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[13px] font-bold hover:bg-[#eff4ff] active:scale-98 transition-all shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#eff4ff] border-b border-[#c4c6cf] text-[12px] text-[#43474e] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Time &amp; Date</th>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Meal &amp; Diet</th>
                    <th className="py-3 px-4">Issued By Staff</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6cf]/60 text-[14px] text-[#0d1c2e]">
                  {displayedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#0d1c2e]">{log.time}</span>
                          <span className="text-[12px] text-[#74777f] font-mono">{log.date}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#002045]">
                        <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[#002045] border border-[#c4c6cf]/50">
                          {log.tokenNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#0d1c2e]">{log.studentName}</span>
                          <span className="text-[12px] text-[#74777f] font-mono">{log.studentId}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#0d1c2e]">{log.mealType}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              log.dietPreference === 'Veg'
                                ? 'bg-[#9ff5c1]/60 text-[#0a6c44]'
                                : 'bg-[#ffdcc2] text-[#8e3800]'
                            }`}
                          >
                            {log.dietPreference}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-[13px] text-[#43474e]">
                          <span className="material-symbols-outlined text-[16px] text-[#1a365d]">
                            badge
                          </span>
                          <span className="font-medium">
                            {log.issuedByName || 'Mess Counter Staff'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold ${
                            log.status === 'Issued'
                              ? 'bg-[#9ff5c1]/60 text-[#0a6c44]'
                              : 'bg-[#ffdad6] text-[#ba1a1a]'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.status === 'Issued' ? 'bg-[#059669]' : 'bg-[#ba1a1a]'
                            }`}
                          />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {displayedLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#74777f]">
                        No token issuance records found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredLogs.length > 8 && (
              <div className="p-3 border-t border-[#c4c6cf] flex justify-center bg-[#f8f9ff]">
                <button
                  onClick={() => setIsFullLogExpanded(!isFullLogExpanded)}
                  className="text-[13px] font-bold text-[#002045] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {isFullLogExpanded ? 'Show Recent 8 Only' : `View All ${filteredLogs.length} Records`}
                  <span className="material-symbols-outlined text-[18px]">
                    {isFullLogExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: HOSTEL ATTENDANCE & FOOD WASTE PREVENTION */}
      {activeView === 'hostelAttendance' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Header Controls: Date & Meal Filter & Export */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#059669] text-[24px]">verified_user</span>
                <h3 className="text-[18px] font-bold text-[#0d1c2e]">
                  Hostel Meal Attendance &amp; Food Waste Prevention
                </h3>
              </div>
              <p className="text-[13px] text-[#43474e] mt-0.5">
                Automatically marks <strong className="text-[#059669]">Present</strong> for students with verified tokens and <strong className="text-[#dc2626]">Absent</strong> for students without tokens to accurately predict food availability and prevent waste.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Filter */}
              <div className="relative min-w-[130px]">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[13px] font-medium appearance-none focus:outline-none focus:border-[#002045]"
                >
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>All Time</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#43474e] text-[18px]">
                  calendar_today
                </span>
              </div>

              {/* Meal Filter */}
              <div className="relative min-w-[130px]">
                <select
                  value={selectedMealFilter}
                  onChange={(e) => setSelectedMealFilter(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[13px] font-medium appearance-none focus:outline-none focus:border-[#002045]"
                >
                  <option>All Meals</option>
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Snacks</option>
                  <option>Dinner</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#43474e] text-[18px]">
                  restaurant
                </span>
              </div>

              {/* Export Attendance CSV */}
              <button
                onClick={handleExportAttendanceCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#002045] hover:bg-[#1a365d] active:scale-95 text-white rounded-lg text-[13px] font-bold transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Attendance
              </button>
            </div>
          </div>

          {/* 4 Bento KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Enrolled Hostel Students */}
            <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-[#43474e] mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Hostel Residents</span>
                  <span className="material-symbols-outlined text-[#002045] text-[22px]">apartment</span>
                </div>
                <div className="text-[30px] font-extrabold text-[#002045]">{totalResidents}</div>
                <div className="text-[12px] text-[#43474e] mt-0.5">Enrolled Hostel Boarders</div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#c4c6cf]/40 text-[11px] font-semibold text-[#43474e]">
                <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[#002045]">{totalVegDemand} Veg</span>
                <span className="px-2 py-0.5 rounded bg-[#ffdcc2] text-[#8e3800]">{totalNonVegDemand} Non-Veg</span>
              </div>
            </div>

            {/* Card 2: Present (Tokens Claimed) */}
            <div className="bg-white border border-[#a7f3d0] rounded-xl p-4 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-[#f0fdf4]">
              <div>
                <div className="flex justify-between items-center text-[#065f46] mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Present (Attended)</span>
                  <span className="material-symbols-outlined text-[#059669] text-[22px]">check_circle</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[30px] font-extrabold text-[#065f46]">{presentCount}</span>
                  <span className="text-[14px] font-bold text-[#059669]">({attendancePercent}%)</span>
                </div>
                <div className="text-[12px] text-[#059669] font-medium mt-0.5">Tokens Issued &amp; Food Served</div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#a7f3d0]/40 text-[11px] font-bold text-[#065f46]">
                <span className="px-2 py-0.5 rounded bg-[#d1fae5] text-[#065f46]">✓ {presentVeg} Veg Claimed</span>
                <span className="px-2 py-0.5 rounded bg-[#fed7aa] text-[#9a3412]">✓ {presentNonVeg} Non-Veg Claimed</span>
              </div>
            </div>

            {/* Card 3: Absent (Token Not Claimed) */}
            <div className="bg-white border border-[#fecaca] rounded-xl p-4 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-[#fff1f2]">
              <div>
                <div className="flex justify-between items-center text-[#991b1b] mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Absent (Not Claimed)</span>
                  <span className="material-symbols-outlined text-[#dc2626] text-[22px]">pending_actions</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[30px] font-extrabold text-[#b91c1c]">{absentCount}</span>
                  <span className="text-[14px] font-bold text-[#dc2626]">
                    ({100 - attendancePercent}%)
                  </span>
                </div>
                <div className="text-[12px] text-[#dc2626] font-medium mt-0.5">Unclaimed / Food Held in Kitchen</div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#fecaca]/40 text-[11px] font-bold text-[#991b1b]">
                <span className="px-2 py-0.5 rounded bg-[#fee2e2] text-[#991b1b]">✕ {absentVeg} Veg Pending</span>
                <span className="px-2 py-0.5 rounded bg-[#fee2e2] text-[#991b1b]">✕ {absentNonVeg} Non-Veg Pending</span>
              </div>
            </div>

            {/* Card 4: Food Waste Prevention */}
            <div className="bg-white border border-[#bbf7d0] rounded-xl p-4 shadow-xs flex flex-col justify-between bg-gradient-to-br from-white to-[#ecfdf5]">
              <div>
                <div className="flex justify-between items-center text-[#065f46] mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Waste Guard</span>
                  <span className="material-symbols-outlined text-[#059669] text-[22px]">eco</span>
                </div>
                <div className="text-[30px] font-extrabold text-[#059669]">
                  +{foodPortionsSaved} Meals Saved
                </div>
                <div className="text-[12px] text-[#047857] font-semibold mt-0.5">
                  Over-Cooking Prevented
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#bbf7d0]/40 text-[11px] text-[#065f46]">
                <span className="font-bold">~{estWasteKgsPrevented} kg food saved</span>
                <span className="px-2 py-0.5 rounded bg-[#d1fae5] text-[#065f46] font-extrabold text-[10px]">
                  Zero Waste Mode
                </span>
              </div>
            </div>
          </div>

          {/* Kitchen Demand & Portion Control Guidance Box */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#c4c6cf]/40 pb-3">
              <div>
                <h4 className="text-[15px] font-bold text-[#0d1c2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ea580c] text-[20px]">skillet</span>
                  Kitchen Food Portion Control &amp; Waste Mitigation Tracker
                </h4>
                <p className="text-[12px] text-[#43474e]">
                  Active Meal Session: <strong>{selectedMealFilter}</strong> ({selectedDate})
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-[#eff4ff] text-[#002045] border border-[#c4c6cf]/60">
                Portion Status: {presentCount} Served / {totalResidents} Enrolled
              </span>
            </div>

            {/* Visual Portion Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Veg Portions */}
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-3.5 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-[13px] text-[#065f46]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                    Vegetarian Portions
                  </div>
                  <span className="text-[12px] font-bold text-[#065f46]">
                    {presentVeg} Served • {absentVeg} Held on Reserve
                  </span>
                </div>
                <div className="w-full bg-[#d1fae5] h-3.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#059669] h-full transition-all duration-500"
                    style={{ width: `${(presentVeg / (totalVegDemand || 1)) * 100}%` }}
                    title={`Served: ${presentVeg}`}
                  />
                  <div
                    className="bg-[#fbbf24] h-full opacity-80"
                    style={{ width: `${(absentVeg / (totalVegDemand || 1)) * 100}%` }}
                    title={`Held on Reserve: ${absentVeg}`}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#047857] mt-2 font-medium">
                  <span>Served: {presentVeg} ({Math.round((presentVeg / (totalVegDemand || 1)) * 100)}%)</span>
                  <span>Waste Avoidance: Hold {absentVeg} portions</span>
                </div>
              </div>

              {/* Non-Veg Portions */}
              <div className="bg-[#fff7ed] border border-[#fed7aa] p-3.5 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-[13px] text-[#9a3412]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
                    Non-Vegetarian Portions
                  </div>
                  <span className="text-[12px] font-bold text-[#9a3412]">
                    {presentNonVeg} Served • {absentNonVeg} Held on Reserve
                  </span>
                </div>
                <div className="w-full bg-[#ffedd5] h-3.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-[#ea580c] h-full transition-all duration-500"
                    style={{ width: `${(presentNonVeg / (totalNonVegDemand || 1)) * 100}%` }}
                    title={`Served: ${presentNonVeg}`}
                  />
                  <div
                    className="bg-[#fbbf24] h-full opacity-80"
                    style={{ width: `${(absentNonVeg / (totalNonVegDemand || 1)) * 100}%` }}
                    title={`Held on Reserve: ${absentNonVeg}`}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#c2410c] mt-2 font-medium">
                  <span>Served: {presentNonVeg} ({Math.round((presentNonVeg / (totalNonVegDemand || 1)) * 100)}%)</span>
                  <span>Waste Avoidance: Hold {absentNonVeg} portions</span>
                </div>
              </div>
            </div>

            {/* Actionable Kitchen Staff Advisory */}
            <div className="bg-[#eff4ff] border border-[#c4c6cf]/60 rounded-xl p-3.5 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#002045] text-[22px] mt-0.5 shrink-0">
                tips_and_updates
              </span>
              <div className="text-[13px] text-[#0d1c2e]">
                <strong className="text-[#002045]">Kitchen Staff Directive: </strong>
                {absentCount > 0 ? (
                  <span>
                    Currently <strong>{absentCount} residents</strong> have not arrived ({absentVeg} Veg, {absentNonVeg} Non-Veg). 
                    <span className="text-[#0a6c44] font-bold"> Do not cook or reheat batch 2 of these {absentCount} portions</span> until students tap their passes at the counter. This guarantees zero leftover food waste!
                  </span>
                ) : (
                  <span className="text-[#0a6c44] font-semibold">
                    All enrolled hostel residents have collected meal tokens. Food consumption is 100% matched with zero surplus waste!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Search, Filter Pills, and Hostel Block Controls */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 shadow-xs flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search input */}
              <div className="relative w-full md:w-96">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#74777f] text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search resident by name, roll no, room, or token..."
                  value={attendanceSearchQuery}
                  onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 border border-[#74777f] rounded-lg bg-[#f8f9ff] text-[13px] text-[#0d1c2e] focus:outline-none focus:bg-white focus:border-[#002045]"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 bg-[#eff4ff] p-1 rounded-xl border border-[#c4c6cf]/60 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setAttendanceStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    attendanceStatusFilter === 'all'
                      ? 'bg-[#002045] text-white shadow-xs'
                      : 'text-[#43474e] hover:text-[#002045]'
                  }`}
                >
                  All ({totalResidents})
                </button>
                <button
                  onClick={() => setAttendanceStatusFilter('present')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    attendanceStatusFilter === 'present'
                      ? 'bg-[#059669] text-white shadow-xs'
                      : 'text-[#065f46] hover:bg-[#d1fae5]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  Present ({presentCount})
                </button>
                <button
                  onClick={() => setAttendanceStatusFilter('absent')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    attendanceStatusFilter === 'absent'
                      ? 'bg-[#dc2626] text-white shadow-xs'
                      : 'text-[#991b1b] hover:bg-[#fee2e2]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                  Absent ({absentCount})
                </button>
              </div>
            </div>

            {/* Secondary Filter Row: Diet and Hostel Block */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#c4c6cf]/30">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#43474e] font-semibold">Diet Filter:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setAttendanceDietFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      attendanceDietFilter === 'all'
                        ? 'bg-[#002045] text-white'
                        : 'bg-[#eff4ff] text-[#43474e] hover:text-[#002045]'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAttendanceDietFilter('Veg')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      attendanceDietFilter === 'Veg'
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]'
                    }`}
                  >
                    🥗 Veg ({totalVegDemand})
                  </button>
                  <button
                    onClick={() => setAttendanceDietFilter('Non-Veg')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      attendanceDietFilter === 'Non-Veg'
                        ? 'bg-[#ea580c] text-white'
                        : 'bg-[#ffedd5] text-[#9a3412] hover:bg-[#fed7aa]'
                    }`}
                  >
                    🍗 Non-Veg ({totalNonVegDemand})
                  </button>
                </div>
              </div>

              {/* Block Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#43474e] font-semibold">Hostel Block:</span>
                <select
                  value={attendanceBlockFilter}
                  onChange={(e) => setAttendanceBlockFilter(e.target.value)}
                  className="h-8 px-2.5 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[12px] font-medium focus:outline-none focus:border-[#002045]"
                >
                  <option value="all">All Blocks</option>
                  {availableBlocks.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <span className="text-[12px] text-[#74777f]">
                  Showing <strong>{filteredAttendanceRoster.length}</strong> of {totalResidents}
                </span>
              </div>
            </div>
          </div>

          {/* Hostel Attendance Table */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#eff4ff] border-b border-[#c4c6cf] text-[12px] text-[#43474e] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Resident Student</th>
                    <th className="py-3 px-4">Hostel &amp; Room</th>
                    <th className="py-3 px-4">Diet Preference</th>
                    <th className="py-3 px-4">Automated Meal Attendance</th>
                    <th className="py-3 px-4">Kitchen Food Impact</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6cf]/60 text-[14px] text-[#0d1c2e]">
                  {filteredAttendanceRoster.map((item) => {
                    const initials = item.student.name
                      ? item.student.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'ST';

                    return (
                      <tr
                        key={item.student.id}
                        className={`transition-colors ${
                          item.isPresent ? 'hover:bg-[#f0fdf4]' : 'hover:bg-[#fff1f2] bg-[#fafafa]/50'
                        }`}
                      >
                        {/* Student Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {item.student.photoUrl ? (
                              <img
                                src={item.student.photoUrl}
                                alt={item.student.name}
                                className="w-10 h-10 rounded-full object-cover border border-[#c4c6cf] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#002045] text-white flex items-center justify-center font-bold text-[13px] shrink-0 shadow-2xs">
                                {initials}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0d1c2e] text-[14px]">
                                {item.student.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px] text-[#74777f] font-mono">
                                <span>{item.student.id}</span>
                                {item.student.department && (
                                  <>
                                    <span>•</span>
                                    <span>{item.student.department}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Hostel & Room */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#eff4ff] text-[#002045] border border-[#c4c6cf]/50 font-mono">
                              {item.hostelBlock}
                            </span>
                            <span className="text-[12px] text-[#43474e]">
                              Room {item.roomNumber}
                            </span>
                          </div>
                        </td>

                        {/* Diet Preference */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              item.dietPreference === 'Veg'
                                ? 'bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0]'
                                : 'bg-[#ffedd5] text-[#9a3412] border border-[#fed7aa]'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                item.dietPreference === 'Veg' ? 'bg-[#059669]' : 'bg-[#ea580c]'
                              }`}
                            />
                            {item.dietPreference}
                          </span>
                        </td>

                        {/* Automated Attendance Status */}
                        <td className="py-3.5 px-4">
                          {item.isPresent ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-[#d1fae5] text-[#065f46] border border-[#a7f3d0] w-fit shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                                Present (Token Issued)
                              </span>
                              <div className="text-[11px] text-[#43474e] mt-1 font-mono flex items-center gap-1">
                                <span className="font-bold text-[#002045]">#{item.tokenNumber}</span>
                                {item.issuedAt && <span>• {item.issuedAt}</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] w-fit">
                                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                                Absent (No Token)
                              </span>
                              <span className="text-[11px] text-[#dc2626] mt-1 font-medium">
                                Awaiting token claim
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Food Impact */}
                        <td className="py-3.5 px-4">
                          {item.isPresent ? (
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#065f46]">
                              <span className="material-symbols-outlined text-[17px] text-[#059669]">
                                restaurant
                              </span>
                              <span>1x {item.dietPreference} Portion Served</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#b45309]">
                              <span className="material-symbols-outlined text-[17px] text-[#d97706]">
                                pause_circle
                              </span>
                              <span>Hold 1x {item.dietPreference} (Waste Prevented)</span>
                            </div>
                          )}
                        </td>

                        {/* Quick Action */}
                        <td className="py-3.5 px-4 text-center">
                          {item.isPresent ? (
                            <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#059669] bg-[#ecfdf5] px-2.5 py-1 rounded-lg border border-[#a7f3d0]">
                              <span className="material-symbols-outlined text-[15px]">verified</span>
                              Attended
                            </span>
                          ) : (
                            <button
                              onClick={() => handleQuickIssue(item.student)}
                              disabled={issuingStudentId === item.student.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#002045] hover:bg-[#1a365d] active:scale-95 text-white text-[12px] font-bold rounded-lg transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Issue token now to mark student Present"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                confirmation_number
                              </span>
                              {issuingStudentId === item.student.id ? 'Issuing...' : 'Issue Token'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredAttendanceRoster.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#74777f]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[36px] text-[#c4c6cf]">
                            person_search
                          </span>
                          <span className="text-[14px] font-medium text-[#43474e]">
                            No hostel residents found matching your filter criteria.
                          </span>
                          <button
                            onClick={() => {
                              setAttendanceSearchQuery('');
                              setAttendanceStatusFilter('all');
                              setAttendanceDietFilter('all');
                              setAttendanceBlockFilter('all');
                            }}
                            className="text-[12px] font-bold text-[#002045] hover:underline mt-1 cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: STAFF LOGINS & ISSUERS */}
      {activeView === 'staffActivity' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* KPI Cards for Mess Users */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 shadow-xs">
              <div className="flex justify-between items-center text-[#43474e] mb-1">
                <span className="text-[12px] font-bold uppercase tracking-wider">Mess Users</span>
                <span className="material-symbols-outlined text-[#002045] text-[20px]">group</span>
              </div>
              <div className="text-[28px] font-extrabold text-[#002045]">{messUsers.length}</div>
              <div className="text-[12px] text-[#74777f] mt-0.5">Custom Object: Mess_User__c</div>
            </div>

            <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 shadow-xs">
              <div className="flex justify-between items-center text-[#43474e] mb-1">
                <span className="text-[12px] font-bold uppercase tracking-wider">Active Operators</span>
                <span className="material-symbols-outlined text-[#0a6c44] text-[20px]">bolt</span>
              </div>
              <div className="text-[28px] font-extrabold text-[#0a6c44]">{totalActiveStaff}</div>
              <div className="text-[12px] text-[#74777f] mt-0.5">Currently active sessions</div>
            </div>

            <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 shadow-xs">
              <div className="flex justify-between items-center text-[#43474e] mb-1">
                <span className="text-[12px] font-bold uppercase tracking-wider">Issued Today</span>
                <span className="material-symbols-outlined text-[#1a365d] text-[20px]">
                  confirmation_number
                </span>
              </div>
              <div className="text-[28px] font-extrabold text-[#002045]">
                {totalTokensIssuedTodayByStaff || stats.totalTokensIssued}
              </div>
              <div className="text-[12px] text-[#74777f] mt-0.5">Tokens distributed today</div>
            </div>

            <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 shadow-xs">
              <div className="flex justify-between items-center text-[#43474e] mb-1">
                <span className="text-[12px] font-bold uppercase tracking-wider">Security Sync</span>
                <span className="material-symbols-outlined text-[#059669] text-[20px]">verified</span>
              </div>
              <div className="text-[28px] font-extrabold text-[#059669]">Synced</div>
              <div className="text-[12px] text-[#74777f] mt-0.5">Google OAuth &amp; Salesforce</div>
            </div>
          </div>

          {/* Search Bar for Staff */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#74777f] text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search staff by name, email, role, or department..."
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-[#74777f] rounded-lg bg-[#f8f9ff] text-[13px] text-[#0d1c2e] focus:outline-none focus:bg-white focus:border-[#002045]"
              />
            </div>

            <div className="text-[13px] text-[#43474e] font-medium">
              Showing <strong>{filteredStaff.length}</strong> registered staff &amp; issuers
            </div>
          </div>

          {/* Mess Users Table */}
          <div className="bg-white border border-[#c4c6cf] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#eff4ff] border-b border-[#c4c6cf] text-[12px] text-[#43474e] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Mess User</th>
                    <th className="py-3 px-4">Role &amp; Department</th>
                    <th className="py-3 px-4">Login Provider</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-center">Tokens Issued Today</th>
                    <th className="py-3 px-4 text-center">Total Tokens Issued</th>
                    <th className="py-3 px-4">Session Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6cf]/60 text-[14px] text-[#0d1c2e]">
                  {filteredStaff.map((u) => {
                    const initials = u.name
                      ? u.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'U';

                    return (
                      <tr key={u.id} className="hover:bg-[#f8f9ff] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#002045] text-white flex items-center justify-center font-bold text-[13px] shadow-2xs shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0d1c2e] text-[14px]">{u.name}</span>
                              <span className="text-[12px] text-[#43474e] font-mono">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#d4e4fc] text-[#002045]">
                              {u.role}
                            </span>
                            <span className="text-[11px] text-[#74777f]">
                              {u.department || 'Central Dining Staff'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#43474e] bg-[#f0f2f5] px-2 py-0.5 rounded border border-[#c4c6cf]/50">
                            <span className="material-symbols-outlined text-[15px] text-[#ea4335]">
                              key
                            </span>
                            {u.loginProvider || 'Google'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-[#0d1c2e]">
                              {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Today'}
                            </span>
                            <span className="text-[11px] text-[#74777f] font-mono">
                              {u.lastLogin
                                ? new Date(u.lastLogin).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Just now'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-3 py-1 bg-[#eff4ff] text-[#002045] font-extrabold text-[14px] rounded-lg border border-[#c4c6cf]/50 min-w-[44px]">
                            {u.tokensIssuedToday ?? 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-[14px] text-[#43474e]">
                            {u.totalTokensIssued ?? u.tokensIssuedToday ?? 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.isActive !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#9ff5c1]/60 text-[#0a6c44]">
                              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                              Active Session
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f0f2f5] text-[#74777f]">
                              <span className="w-2 h-2 rounded-full bg-[#74777f]" />
                              Offline
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStaff.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[#74777f]">
                        No staff members found matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
