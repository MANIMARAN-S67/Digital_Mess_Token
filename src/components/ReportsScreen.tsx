import React, { useState, useMemo } from 'react';
import { DailyStats, MealType, TokenIssuanceLog } from '../types';

interface ReportsScreenProps {
  stats: DailyStats;
  logs: TokenIssuanceLog[];
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ stats, logs }) => {
  const [selectedDate, setSelectedDate] = useState('Today (Oct 24)');
  const [selectedMealFilter, setSelectedMealFilter] = useState<string>('All Meals');
  const [isFullLogExpanded, setIsFullLogExpanded] = useState(false);

  // Filter logs based on meal filter
  const filteredLogs = useMemo(() => {
    if (selectedMealFilter === 'All Meals') {
      return logs;
    }
    return logs.filter((log) => log.mealType === selectedMealFilter);
  }, [logs, selectedMealFilter]);

  const displayedLogs = isFullLogExpanded ? filteredLogs : filteredLogs.slice(0, 6);

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ['Time', 'Date', 'Token Number', 'Student ID', 'Student Name', 'Meal Type', 'Diet Preference', 'Status', 'Decline Reason'];
    const rows = filteredLogs.map((log) => [
      `"${log.time}"`,
      `"${log.date}"`,
      `"${log.tokenNumber}"`,
      `"${log.studentId}"`,
      `"${log.studentName}"`,
      `"${log.mealType}"`,
      `"${log.dietPreference}"`,
      `"${log.status}"`,
      `"${log.declineReason || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
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

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-4 pb-28 md:pb-12 flex flex-col gap-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-1">
        <div>
          <h2 className="text-[24px] font-semibold text-[#0d1c2e] tracking-tight">
            Reports &amp; Analytics
          </h2>
          <p className="text-[15px] text-[#43474e] mt-0.5">
            Today's mess overview and token distribution.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Date Filter */}
          <div className="relative min-w-[160px]">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-11 pl-3.5 pr-9 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[14px] font-medium appearance-none focus:outline-none focus:border-[#002045] focus:ring-1 focus:ring-[#002045] shadow-2xs"
            >
              <option>Today (Oct 24)</option>
              <option>Yesterday</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#43474e] text-[18px]">
              calendar_today
            </span>
          </div>

          {/* Meal Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={selectedMealFilter}
              onChange={(e) => setSelectedMealFilter(e.target.value)}
              className="w-full h-11 pl-3.5 pr-9 border border-[#74777f] rounded-lg bg-white text-[#0d1c2e] text-[14px] font-medium appearance-none focus:outline-none focus:border-[#002045] focus:ring-1 focus:ring-[#002045] shadow-2xs"
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
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Total Attendance Donut Gauge (Hero Stat) */}
        <div className="md:col-span-5 lg:col-span-4 bg-white border border-[#c4c6cf] rounded-xl p-5 flex flex-col items-center justify-between relative overflow-hidden shadow-xs hover:shadow-sm transition-shadow">
          <div className="w-full flex justify-between items-center mb-2">
            <h3 className="text-[12px] font-bold text-[#43474e] uppercase tracking-wider text-left">
              Total Attendance
            </h3>
            <span className="text-[11px] text-[#0a6c44] font-bold bg-[#9ff5c1]/60 px-2 py-0.5 rounded">
              Goal: 80%
            </span>
          </div>

          <div className="relative w-44 h-44 flex items-center justify-center my-3">
            {/* SVG Donut Chart */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="#e5eeff"
                strokeWidth="12"
              />
              {/* Progress Circle */}
              <circle
                className="progress-circle"
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
              <span className="text-[34px] font-extrabold text-[#002045] leading-none">
                {attendanceRate}%
              </span>
              <span className="text-[12px] font-medium text-[#43474e] mt-1">
                {totalCount} / {stats.totalEligible}
              </span>
            </div>
          </div>

          <p className="text-[14px] text-[#0a6c44] font-semibold flex items-center gap-1 w-full justify-center pt-2 border-t border-[#c4c6cf]/30">
            <span className="material-symbols-outlined text-[18px]">trending_up</span>
            +5% vs Yesterday
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
                Active Session: <strong className="text-[#002045]">Lunch</strong>
              </span>
            </div>

            <div className="flex flex-col justify-center gap-6 mt-4">
              {/* Vegetarian Bar */}
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

              {/* Non-Vegetarian Bar */}
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
                +{stats.vegTarget - stats.vegCount} Meals
              </p>
            </div>
            <div className="bg-[#eff4ff] p-3 rounded-lg text-center">
              <p className="text-[11px] text-[#43474e] uppercase font-semibold">Non-Veg Buffer</p>
              <p className="text-[16px] font-bold text-[#c05621]">
                +{stats.nonVegTarget - stats.nonVegCount} Meals
              </p>
            </div>
          </div>
        </div>

        {/* Peak Hours Service Flow Chart (Lunch) */}
        <div className="md:col-span-12 bg-white border border-[#c4c6cf] rounded-xl p-5 shadow-xs">
          <div className="flex flex-wrap justify-between items-center mb-3">
            <div>
              <h3 className="text-[12px] font-bold text-[#43474e] uppercase tracking-wider">
                Service Flow (Lunch)
              </h3>
              <p className="text-[12px] text-[#74777f]">Distribution density by 30-minute intervals</p>
            </div>
            <span className="px-2.5 py-1 bg-[#d4e4fc] rounded text-[12px] font-semibold text-[#002045]">
              12:00 PM - 2:30 PM
            </span>
          </div>

          <div className="h-44 w-full flex items-end justify-between gap-2 sm:gap-4 mt-6 relative pb-6 px-1">
            {stats.flowHourly.map((item, index) => {
              const isPeak = item.heightPercent === 100;
              return (
                <div
                  key={index}
                  className="w-full flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-[#223144] text-[#eaf1ff] px-2 py-1 rounded text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md z-20">
                    {item.time}: <strong>{item.count} tokens</strong>
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      isPeak
                        ? 'bg-[#002045] group-hover:bg-[#1a365d]'
                        : 'bg-[#adc7f7] group-hover:bg-[#002045]'
                    }`}
                    style={{ height: `${item.heightPercent}%` }}
                  />

                  {/* Label */}
                  <span className="absolute -bottom-6 text-[11px] text-[#74777f] font-mono font-medium">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-white border border-[#c4c6cf] rounded-xl shadow-xs overflow-hidden mt-1">
        <div className="p-4 sm:p-5 border-b border-[#c4c6cf] flex justify-between items-center bg-[#ffffff]">
          <div>
            <h3 className="text-[18px] font-bold text-[#0d1c2e]">Recent Token Issuances</h3>
            <p className="text-[12px] text-[#43474e]">
              Showing {displayedLogs.length} of {filteredLogs.length} logs
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
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="bg-[#eff4ff] border-b border-[#c4c6cf] text-[12px] text-[#43474e] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Meal Type</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c6cf]/60 text-[14px] text-[#0d1c2e]">
              {displayedLogs.map((log) => {
                const isVeg = log.dietPreference === 'Veg';
                const isIssued = log.status === 'Issued';

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-[#f8f9ff] transition-colors"
                  >
                    <td className="py-3 px-4 text-[#43474e] font-mono text-[13px]">
                      {log.time}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#002045]">
                      {log.studentId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#0d1c2e]">
                      {log.studentName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#d4e4fc]/60 text-[12px] font-bold">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isVeg ? 'bg-[#059669]' : 'bg-[#ea580c]'
                          }`}
                        />
                        <span className={isVeg ? 'text-[#0a6c44]' : 'text-[#c05621]'}>
                          {log.dietPreference}
                        </span>
                      </span>
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
            </tbody>
          </table>
        </div>

        <div className="p-3.5 border-t border-[#c4c6cf] text-center bg-[#ffffff]">
          <button
            onClick={() => setIsFullLogExpanded(!isFullLogExpanded)}
            className="text-[13px] font-bold text-[#002045] hover:underline cursor-pointer"
          >
            {isFullLogExpanded ? 'Show Less' : 'View Full Log'}
          </button>
        </div>
      </div>
    </div>
  );
};
