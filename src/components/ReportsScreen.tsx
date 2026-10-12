import React, { useState, useMemo } from 'react';
import { DailyStats, MealType, TokenIssuanceLog, MessUserRecord } from '../types';

interface ReportsScreenProps {
  stats: DailyStats;
  logs: TokenIssuanceLog[];
  messUsers?: MessUserRecord[];
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ stats, logs, messUsers = [] }) => {
  const [activeView, setActiveView] = useState<'overview' | 'staffActivity'>('overview');
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>('All Meals');
  const [isFullLogExpanded, setIsFullLogExpanded] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Filter logs based on meal filter
  const filteredLogs = useMemo(() => {
    if (selectedMealFilter === 'All Meals') {
      return logs;
    }
    return logs.filter((log) => log.mealType === selectedMealFilter);
  }, [logs, selectedMealFilter]);

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

  // Export CSV handler
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
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mess_tokens_${selectedDate.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic calculations based on state
  const totalCount = stats.totalTokensIssued;
  const vegPct = Math.round((stats.vegCount / (stats.vegCount + stats.nonVegCount || 1)) * 100);
  const nonVegPct = 100 - vegPct;

  // Donut chart calculations (circumference = 2 * PI * 40 ≈ 251.3)
  const attendanceRate = stats.attendanceRate || 85;
  const strokeDashoffset = 251.3 - (251.3 * attendanceRate) / 100;

  // Staff summary calculations
  const totalActiveStaff = messUsers.filter((u) => u.isActive !== false).length;
  const totalTokensIssuedTodayByStaff = messUsers.reduce(
    (acc, u) => acc + (u.tokensIssuedToday || 0),
    0
  );

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-4 pb-28 md:pb-12 flex flex-col gap-6">
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
            Track student token distribution, login sessions, and staff issuing operations.
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-[#eff4ff] p-1 rounded-xl border border-[#c4c6cf]/60 shadow-2xs">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
              activeView === 'overview'
                ? 'bg-[#002045] text-white shadow-xs'
                : 'text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            Tokens &amp; Meals
          </button>
          <button
            onClick={() => setActiveView('staffActivity')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
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

      {activeView === 'overview' && (
        <>
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
                        {vegPct}% ({stats.vegCount})
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
                        {nonVegPct}% ({stats.nonVegCount})
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
                    +{Math.max(0, stats.vegTarget - stats.vegCount)} Meals
                  </p>
                </div>
                <div className="bg-[#eff4ff] p-3 rounded-lg text-center">
                  <p className="text-[11px] text-[#43474e] uppercase font-semibold">Non-Veg Buffer</p>
                  <p className="text-[16px] font-bold text-[#c05621]">
                    +{Math.max(0, stats.nonVegTarget - stats.nonVegCount)} Meals
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
                className="flex items-center gap-1.5 px-3.5 py-2 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[13px] font-bold hover:bg-[#eff4ff] active:scale-98 transition-all shadow-2xs"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#eff4ff] border-b border-[#c4c6cf] text-[12px] text-[#43474e] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Token #</th>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Meal Type</th>
                    <th className="py-3 px-4">Issued By (Staff / User)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c4c6cf]/60 text-[14px] text-[#0d1c2e]">
                  {displayedLogs.map((log) => {
                    const isVeg = log.dietPreference === 'Veg';
                    const isIssued = log.status === 'Issued';

                    return (
                      <tr key={log.id} className="hover:bg-[#f8f9ff] transition-colors">
                        <td className="py-3 px-4 text-[#43474e] font-mono text-[13px]">{log.time}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#002045]">
                          {log.tokenNumber}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#43474e]">
                          {log.studentId}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0d1c2e]">{log.studentName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#d4e4fc]/60 text-[12px] font-bold">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isVeg ? 'bg-[#059669]' : 'bg-[#ea580c]'
                              }`}
                            />
                            <span className={isVeg ? 'text-[#0a6c44]' : 'text-[#c05621]'}>
                              {log.mealType} ({log.dietPreference})
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#002045]/10 text-[#002045] flex items-center justify-center font-bold text-[11px] shrink-0">
                              {(log.issuedByName || 'A')[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-[#0d1c2e] leading-snug">
                                {log.issuedByName || 'Mess Counter Staff'}
                              </span>
                              {log.issuedByEmail && (
                                <span className="text-[11px] text-[#74777f] font-mono leading-none">
                                  {log.issuedByEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isIssued ? (
                            <span className="inline-flex items-center gap-1 text-[#0a6c44] font-bold text-[13px]">
                              <span className="material-symbols-outlined text-[18px]">check_circle</span>
                              Issued
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[#ba1a1a] font-bold text-[13px]"
                              title={log.declineReason}
                            >
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                              Declined
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {displayedLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#74777f] text-[14px]">
                        No meal tokens found for the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 border-t border-[#c4c6cf] text-center bg-[#ffffff]">
              <button
                onClick={() => setIsFullLogExpanded(!isFullLogExpanded)}
                className="text-[13px] font-bold text-[#002045] hover:underline cursor-pointer"
              >
                {isFullLogExpanded ? 'Show Less' : `View Full Log (${filteredLogs.length} total)`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Staff Logins & Token Issuers View */}
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
