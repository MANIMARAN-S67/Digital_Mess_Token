import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { NavTab, BottomNavBar } from './components/BottomNavBar';
import { DesktopSideNav } from './components/DesktopSideNav';
import { TopAppBar } from './components/TopAppBar';
import { HomeScreen } from './components/HomeScreen';
import { SearchScreen } from './components/SearchScreen';
import { MenuScreen } from './components/MenuScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { TokenSlipModal } from './components/TokenSlipModal';
import { QRScannerModal } from './components/QRScannerModal';
import { RegisterStudentModal } from './components/RegisterStudentModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { AdminProfileModal } from './components/AdminProfileModal';
import {
  INITIAL_STUDENTS,
  INITIAL_MENU,
  INITIAL_LOGS,
  INITIAL_STATS
} from './data/initialData';
import { LoginScreen } from './components/LoginScreen';
import { TwoFactorScreen } from './components/TwoFactorScreen';
import { DailyMenu, DailyStats, MealType, Student, TokenIssuanceLog } from './types';

type AuthStep = 'login' | '2fa' | 'authenticated';

export default function App() {
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [currentMeal, setCurrentMeal] = useState<MealType>('Lunch');
  
  // Persistent or stateful collections
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('mess_manager_students');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [menu, setMenu] = useState<DailyMenu>(() => {
    try {
      const saved = localStorage.getItem('mess_manager_menu');
      return saved ? JSON.parse(saved) : INITIAL_MENU;
    } catch {
      return INITIAL_MENU;
    }
  });

  const [logs, setLogs] = useState<TokenIssuanceLog[]>(() => {
    try {
      const saved = localStorage.getItem('mess_manager_logs');
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [stats, setStats] = useState<DailyStats>(() => {
    try {
      const saved = localStorage.getItem('mess_manager_stats');
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  // Selected student for token verification/issuance
  const [selectedStudentId, setSelectedStudentId] = useState<string>('21CS1004');
  
  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [messHall, setMessHall] = useState('Central Mess Hall A');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active token slip modal state
  const [issuedSlipData, setIssuedSlipData] = useState<{
    student: Student | null;
    tokenNumber: string;
    issuedAt: string;
    mealType: MealType;
  } | null>(null);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('mess_manager_students', JSON.stringify(students));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('mess_manager_menu', JSON.stringify(menu));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [menu]);

  useEffect(() => {
    try {
      localStorage.setItem('mess_manager_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem('mess_manager_stats', JSON.stringify(stats));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }, [stats]);

  // Audio chime feedback using Web Audio API synthesis
  const playSoundChime = (type: 'success' | 'alert') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (err) {
      console.warn('Web Audio not allowed without user gesture yet', err);
    }
  };

  // Issue token workflow
  const handleIssueToken = (student: Student) => {
    const nextTokenNum = `LN-${stats.totalTokensIssued + 1}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    // 1. Update student
    const updatedStudent: Student = {
      ...student,
      issuedSessionsToday: {
        ...student.issuedSessionsToday,
        [currentMeal]: {
          tokenNumber: nextTokenNum,
          issuedAt: timeStr,
          timestamp: Date.now()
        }
      }
    };

    setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

    // 2. Add to logs
    const newLog: TokenIssuanceLog = {
      id: `log-${Date.now()}`,
      tokenNumber: nextTokenNum,
      time: timeStr,
      date: dateStr,
      studentId: student.id,
      studentName: student.name,
      mealType: currentMeal,
      dietPreference: student.preference,
      status: 'Issued'
    };

    setLogs((prev) => [newLog, ...prev]);

    // 3. Update stats
    setStats((prev) => {
      const isVeg = student.preference === 'Veg';
      const newTotal = prev.totalTokensIssued + 1;
      const newVeg = isVeg ? prev.vegCount + 1 : prev.vegCount;
      const newNonVeg = !isVeg ? prev.nonVegCount + 1 : prev.nonVegCount;
      const newAttendance = Math.min(100, Math.round((newTotal / prev.totalEligible) * 100));

      return {
        ...prev,
        totalTokensIssued: newTotal,
        vegCount: newVeg,
        nonVegCount: newNonVeg,
        attendanceRate: newAttendance
      };
    });

    // 4. Play audio chime and burst confetti
    playSoundChime('success');
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.65 }
    });

    // 5. Open slip modal
    setIssuedSlipData({
      student: updatedStudent,
      tokenNumber: nextTokenNum,
      issuedAt: timeStr,
      mealType: currentMeal
    });
  };

  // Admin override to reset session for a student
  const handleResetStudentSession = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const sessions = { ...s.issuedSessionsToday };
          delete sessions[currentMeal];
          return {
            ...s,
            issuedSessionsToday: sessions
          };
        }
        return s;
      })
    );
  };

  // Register new student handler
  const handleRegisterStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
    setSelectedStudentId(newStudent.id);
    setCurrentTab('search');
    playSoundChime('success');
  };

  // Save updated menu
  const handleSaveMenu = (updatedMenu: DailyMenu) => {
    setMenu(updatedMenu);
    playSoundChime('success');
  };

  // Select student and navigate to Search / Issue screen
  const handleSelectStudentForIssue = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentTab('search');
  };

  if (authStep === 'login') {
    return <LoginScreen onProceedTo2FA={() => setAuthStep('2fa')} />;
  }

  if (authStep === '2fa') {
    return (
      <TwoFactorScreen 
        onAuthenticate={() => setAuthStep('authenticated')} 
        onBackToLogin={() => setAuthStep('login')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2e] flex flex-col font-sans selection:bg-[#1a365d] selection:text-white">
      {/* Top App Bar */}
      <TopAppBar
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={2}
      />

      {/* Desktop Side Navigation (visible on md+) */}
      <DesktopSideNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onOpenQuickIssue={() => {
          setSelectedStudentId('21CS1004');
          setCurrentTab('search');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-[64px] md:pl-[240px] flex flex-col">
        {currentTab === 'home' && (
          <HomeScreen
            currentMeal={currentMeal}
            onChangeMeal={setCurrentMeal}
            stats={stats}
            menu={menu}
            recentLogs={logs}
            onChangeTab={setCurrentTab}
            onOpenRegisterStudent={() => setIsRegisterOpen(true)}
            onSelectStudentForIssue={handleSelectStudentForIssue}
          />
        )}

        {currentTab === 'search' && (
          <SearchScreen
            currentMeal={currentMeal}
            students={students}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            onIssueToken={handleIssueToken}
            onResetStudentSession={handleResetStudentSession}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {currentTab === 'menu' && (
          <MenuScreen initialMenu={menu} onSaveMenu={handleSaveMenu} />
        )}

        {currentTab === 'reports' && <ReportsScreen stats={stats} logs={logs} />}
      </main>

      {/* Bottom Navigation Bar for Mobile */}
      <BottomNavBar currentTab={currentTab} onChangeTab={setCurrentTab} />

      {/* Modals & Drawers */}
      <TokenSlipModal
        isOpen={Boolean(issuedSlipData)}
        onClose={() => setIssuedSlipData(null)}
        student={issuedSlipData?.student || null}
        mealType={issuedSlipData?.mealType || currentMeal}
        tokenNumber={issuedSlipData?.tokenNumber || ''}
        issuedAt={issuedSlipData?.issuedAt || ''}
      />

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        students={students}
        onSelectScannedStudent={(id) => {
          setSelectedStudentId(id);
          setCurrentTab('search');
        }}
      />

      <RegisterStudentModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterStudent={handleRegisterStudent}
      />

      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AdminProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        selectedMessHall={messHall}
        onSelectMessHall={setMessHall}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />
    </div>
  );
}
