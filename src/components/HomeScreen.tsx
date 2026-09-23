import React from 'react';
import { DailyMenu, DailyStats, MealType, TokenIssuanceLog } from '../types';
import { NavTab } from './BottomNavBar';

interface HomeScreenProps {
  currentMeal: MealType;
  onChangeMeal: (meal: MealType) => void;
  stats: DailyStats;
  menu: DailyMenu;
  recentLogs: TokenIssuanceLog[];
  onChangeTab: (tab: NavTab) => void;
  onOpenRegisterStudent: () => void;
  onSelectStudentForIssue: (studentId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentMeal,
  onChangeMeal,
  stats,
  menu,
  recentLogs,
  onChangeTab,
  onOpenRegisterStudent,
  onSelectStudentForIssue
}) => {
  const mealSessionTimes: Record<MealType, { time: string; remaining: string }> = {
    Breakfast: { time: '07:30 AM - 09:30 AM', remaining: 'Ended' },
    Lunch: { time: '12:30 PM - 02:30 PM', remaining: 'Ends in 45 mins' },
    Snacks: { time: '04:30 PM - 05:30 PM', remaining: 'Starts at 4:30 PM' },
    Dinner: { time: '07:30 PM - 09:30 PM', remaining: 'Starts at 7:30 PM' }
  };

  const vegPercentage = Math.round((stats.vegCount / stats.vegTarget) * 100);
  const nonVegPercentage = Math.round((stats.nonVegCount / stats.nonVegTarget) * 100);

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 py-4 pb-28 md:pb-12">
      {/* Welcome Section */}
      <section className="mt-2 mb-6">
        <h2 className="text-[24px] font-semibold text-[#0d1c2e] tracking-tight">
          Welcome back, Admin
        </h2>
        <p className="text-[15px] text-[#43474e] mt-0.5">
          Manage daily mess operations efficiently.
        </p>
      </section>

      {/* Current Status Card */}
      <section className="mb-6">
        <div className="bg-[#f8f9ff] rounded-xl border border-[#c4c6cf]/70 p-4 sm:p-5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-[#0a6c44]" />
          
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3 pl-2 sm:pl-3">
            <div>
              <h3 className="text-[12px] font-bold text-[#0d1c2e] uppercase tracking-wider mb-1">
                Current Session
              </h3>
              <div className="flex items-center gap-3">
                <p className="text-[24px] font-bold text-[#002045] tracking-tight">
                  {currentMeal}
                </p>
                <div className="flex items-center gap-1.5 bg-[#9ff5c1]/70 text-[#167249] px-2.5 py-0.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-[#0a6c44] animate-pulse" />
                  <span className="text-[12px] font-bold">Active</span>
                </div>
              </div>
            </div>

            {/* Session Switcher Pill Buttons */}
            <div className="flex items-center gap-1 bg-[#eff4ff] p-1 rounded-lg border border-[#c4c6cf]/40">
              {(['Breakfast', 'Lunch', 'Snacks', 'Dinner'] as MealType[]).map((meal) => (
                <button
                  key={meal}
                  onClick={() => onChangeMeal(meal)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all ${
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
              <span>{mealSessionTimes[currentMeal].time}</span>
            </p>
            <span className="text-[12px] text-[#002045] font-semibold bg-[#dce9ff]/70 px-2 py-0.5 rounded">
              {mealSessionTimes[currentMeal].remaining}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="mb-6">
        <h3 className="text-[12px] font-bold text-[#43474e] mb-3 uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Issue Token (Primary) */}
          <button
            onClick={() => onChangeTab('search')}
            className="bg-[#002045] text-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-[#1a365d] active:scale-98 transition-all shadow-[0_2px_4px_rgba(0,32,69,0.15)] group"
          >
            <span
              className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              qr_code_scanner
            </span>
            <span className="text-[14px] font-bold text-center">Issue Token</span>
          </button>

          {/* Update Menu */}
          <button
            onClick={() => onChangeTab('menu')}
            className="bg-white border border-[#1a365d] text-[#002045] rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-[#eff4ff] active:scale-98 transition-all shadow-xs group"
          >
            <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">
              restaurant_menu
            </span>
            <span className="text-[14px] font-bold text-center">Update Menu</span>
          </button>

          {/* Register Student */}
          <button
            onClick={onOpenRegisterStudent}
            className="bg-white border border-[#c4c6cf] text-[#0d1c2e] rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-[#eff4ff] active:scale-98 transition-all shadow-xs group"
          >
            <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">
              person_add
            </span>
            <span className="text-[14px] font-bold text-center">Register Student</span>
          </button>

          {/* View Reports */}
          <button
            onClick={() => onChangeTab('reports')}
            className="bg-white border border-[#c4c6cf] text-[#0d1c2e] rounded-xl p-4 flex flex-col items-center justify-center gap-2 h-32 hover:bg-[#eff4ff] active:scale-98 transition-all shadow-xs group"
          >
            <span className="material-symbols-outlined text-[32px] group-hover:scale-110 transition-transform">
              bar_chart
            </span>
            <span className="text-[14px] font-bold text-center">View Reports</span>
          </button>
        </div>
      </section>

      {/* Grid for Daily Snapshot + Fast Token Issuance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Daily Snapshot */}
        <section className="lg:col-span-7">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[12px] font-bold text-[#43474e] uppercase tracking-wider">
              Daily Snapshot
            </h3>
            <span className="text-[11px] text-[#74777f] font-medium">Updated just now</span>
          </div>

          <div className="bg-white rounded-xl border border-[#c4c6cf]/70 p-5 shadow-xs">
            <div className="flex justify-between items-end mb-5">
              <div>
                <p className="text-[12px] font-medium text-[#43474e] mb-1">Total Tokens Issued</p>
                <p className="text-[32px] font-extrabold text-[#002045] leading-tight">
                  {stats.totalTokensIssued}
                </p>
                <p className="text-[11px] text-[#0a6c44] font-semibold flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  +12% from yesterday
                </p>
              </div>

              <div className="text-right">
                <p className="text-[12px] font-medium text-[#43474e] mb-1">Attendance</p>
                <p className="text-[22px] font-bold text-[#0a6c44] leading-tight">
                  {stats.attendanceRate}%
                </p>
                <p className="text-[11px] text-[#74777f]">
                  {stats.totalTokensIssued} / {stats.totalEligible}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#c4c6cf]/30">
              {/* Veg Bar */}
              <div>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-[#0d1c2e] font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0a6c44]" />
                    Vegetarian
                  </span>
                  <span className="text-[#43474e] font-medium">
                    {stats.vegCount} / {stats.vegTarget} ({vegPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#e5eeff] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0a6c44] h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, vegPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Non-Veg Bar */}
              <div>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-[#0d1c2e] font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f47d45]" />
                    Non-Vegetarian
                  </span>
                  <span className="text-[#43474e] font-medium">
                    {stats.nonVegCount} / {stats.nonVegTarget} ({nonVegPercentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#e5eeff] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#f47d45] h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, nonVegPercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fast Token Issuance Banner (from Image 8) */}
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
              <p className="text-[14px] text-[#43474e] leading-relaxed">
                Scan student ID barcode or search roll number to verify active meal plan and print physical or digital token slip.
              </p>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => onChangeTab('search')}
                className="w-full h-11 bg-[#002045] hover:bg-[#1a365d] text-white rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Issue New Token
              </button>

              <button
                onClick={() => onSelectStudentForIssue('21CS1004')}
                className="w-full py-2 bg-white hover:bg-[#dce9ff]/40 text-[#002045] border border-[#c4c6cf] rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                Quick Test: Rahul Sharma (21CS1004)
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Today's Menu Summary Table (from Image 8) */}
      <section className="mb-6">
        <div className="bg-white rounded-xl border border-[#c4c6cf]/70 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#c4c6cf]/60 bg-[#f8f9ff] flex justify-between items-center">
            <h3 className="text-[17px] font-bold text-[#0d1c2e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#002045]">restaurant_menu</span>
              Today's Menu
            </h3>
            <button
              onClick={() => onChangeTab('menu')}
              className="text-[#002045] hover:bg-[#eff4ff] text-[13px] font-bold px-3 py-1.5 rounded transition-colors flex items-center gap-1"
            >
              <span>Edit</span>
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[#eff4ff]/60 border-b border-[#c4c6cf]/40 text-[11px] text-[#43474e] uppercase font-bold tracking-wider">
                  <th className="py-3 px-4 w-[22%]">Meal</th>
                  <th className="py-3 px-4 w-[39%]">Vegetarian</th>
                  <th className="py-3 px-4 w-[39%]">Non-Vegetarian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c6cf]/40 text-[14px]">
                {/* Breakfast */}
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-4 align-top">
                    <span className="inline-block bg-[#dce9ff] text-[#002045] px-2 py-0.5 rounded text-[11px] font-bold mb-1">
                      Breakfast
                    </span>
                    <div className="text-[12px] text-[#74777f]">07:30 - 09:30</div>
                  </td>
                  <td className="py-3 px-4 align-top text-[#0d1c2e]">
                    <div className="font-semibold text-[#0a6c44]">
                      {menu.Breakfast.veg.mainItem}
                    </div>
                    <div className="text-[12px] text-[#43474e]">
                      {menu.Breakfast.veg.side1}, {menu.Breakfast.veg.beverage}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-top text-[#0d1c2e]">
                    <div className="font-semibold text-[#c05621]">
                      {menu.Breakfast.nonVeg.mainItem}
                    </div>
                    <div className="text-[12px] text-[#43474e]">
                      {menu.Breakfast.nonVeg.side1}, {menu.Breakfast.nonVeg.beverage}
                    </div>
                  </td>
                </tr>

                {/* Lunch (Active) */}
                <tr className="bg-[#eff4ff]/40 hover:bg-[#eff4ff]/70 transition-colors relative">
                  <td className="py-3 px-4 align-top relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1a365d]" />
                    <span className="inline-flex items-center gap-1 bg-[#1a365d] text-white px-2 py-0.5 rounded text-[11px] font-bold mb-1 shadow-xs">
                      Lunch (Active)
                    </span>
                    <div className="text-[12px] font-semibold text-[#1a365d]">12:30 - 14:30</div>
                  </td>
                  <td className="py-3 px-4 align-top border-l border-[#c4c6cf]/30">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#0a6c44]" />
                      <span className="font-bold text-[#0a6c44]">{menu.Lunch.veg.mainItem}</span>
                    </div>
                    <div className="text-[12px] text-[#43474e]">
                      {menu.Lunch.veg.side1} • {menu.Lunch.veg.beverage}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-top border-l border-[#c4c6cf]/30">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#f47d45]" />
                      <span className="font-bold text-[#c05621]">{menu.Lunch.nonVeg.mainItem}</span>
                    </div>
                    <div className="text-[12px] text-[#43474e]">
                      {menu.Lunch.nonVeg.side1} • {menu.Lunch.nonVeg.beverage}
                    </div>
                  </td>
                </tr>

                {/* Dinner */}
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 px-4 align-top">
                    <span className="inline-block bg-[#dce9ff] text-[#002045] px-2 py-0.5 rounded text-[11px] font-bold mb-1">
                      Dinner
                    </span>
                    <div className="text-[12px] text-[#74777f]">19:30 - 21:30</div>
                  </td>
                  <td className="py-3 px-4 align-top text-[#0d1c2e]">
                    <div className="font-semibold text-[#0a6c44]">
                      {menu.Dinner.veg.mainItem}
                    </div>
                    <div className="text-[12px] text-[#43474e]">
                      {menu.Dinner.veg.side1}, {menu.Dinner.veg.beverage}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-top text-[#0d1c2e]">
                    <div className="font-semibold text-[#c05621]">
                      {menu.Dinner.nonVeg.mainItem}
                    </div>
                    <div className="text-[12px] text-[#43474e]">
                      {menu.Dinner.nonVeg.side1}, {menu.Dinner.nonVeg.beverage}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[12px] font-bold text-[#43474e] uppercase tracking-wider">
            Recent Activity
          </h3>
          <button
            onClick={() => onChangeTab('reports')}
            className="text-[13px] text-[#002045] font-bold hover:underline"
          >
            View All
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#c4c6cf]/70 shadow-xs overflow-hidden">
          <ul className="divide-y divide-[#c4c6cf]/40">
            {recentLogs.slice(0, 5).map((log) => {
              const initials = log.studentName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              const isVeg = log.dietPreference === 'Veg';

              return (
                <li
                  key={log.id}
                  onClick={() => onSelectStudentForIssue(log.studentId)}
                  className="p-3.5 sm:p-4 flex justify-between items-center hover:bg-[#eff4ff]/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                        isVeg
                          ? 'bg-[#9ff5c1] text-[#005231]'
                          : 'bg-[#ffdbcd] text-[#612100]'
                      }`}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#0d1c2e] leading-snug">
                        {log.studentName}
                      </p>
                      <p className="text-[12px] text-[#74777f]">
                        ID: <span className="font-mono text-[#002045] font-medium">{log.studentId}</span> • Token {log.tokenNumber}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold mb-1 uppercase ${
                        isVeg
                          ? 'bg-[#9ff5c1] text-[#167249]'
                          : 'bg-[#ffdbcd] text-[#93000a]'
                      }`}
                    >
                      {isVeg ? 'VEG' : 'N-VEG'}
                    </span>
                    <p className="text-[11px] text-[#74777f]">{log.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
};
