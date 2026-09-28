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
import { LoginScreen } from './components/LoginScreen';
import { TwoFactorScreen } from './components/TwoFactorScreen';
import { DailyMenu, DailyStats, MealType, Student, TokenIssuanceLog } from './types';
import { useAuth } from './context/AuthContext';
import api from './services/api';

type AuthStep = 'login' | '2fa' | 'authenticated';

export default function App() {
  const { dbUser, loading: authLoading } = useAuth();
  
  // Use dbUser from context instead of local authStep
  const [authStep, setAuthStep] = useState<AuthStep>('login');
  
  useEffect(() => {
    if (dbUser) {
      setAuthStep('authenticated');
    } else {
      setAuthStep('login');
    }
  }, [dbUser]);

  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [currentMeal, setCurrentMeal] = useState<MealType>('Lunch');
  
  // API Driven State
  const [students, setStudents] = useState<Student[]>([]);
  const [menu, setMenu] = useState<DailyMenu>({} as DailyMenu); // We'll adapt backend to this shape or adapt UI
  const [logs, setLogs] = useState<TokenIssuanceLog[]>([]);
  const [stats, setStats] = useState<DailyStats>({} as DailyStats);
  const [loadingData, setLoadingData] = useState(false);

  const fetchData = async () => {
    if (!dbUser) return;
    setLoadingData(true);
    try {
      if (['Admin', 'Warden', 'Mess Management'].includes(dbUser.role)) {
        const [studentsRes, dashboardRes, historyRes] = await Promise.all([
          api.get('/students'),
          api.get('/dashboard'),
          api.get('/tokens/history')
        ]);
        
        // Adapt students to frontend model
        setStudents(studentsRes.data.map((s: any) => ({
          id: s.Student_ID__c,
          name: s.Name,
          department: s.Department__c || 'Unknown',
          hostelRoom: s.Hostel_Room__c || 'Unknown',
          preference: s.Diet_Preference__c,
          status: s.Status__c,
          photoUrl: s.Photo_URL__c || 'https://via.placeholder.com/150',
          phone: s.Phone__c,
          email: s.Email__c,
          issuedSessionsToday: {} // We would fetch this properly from today's tokens
        })));
        
        // Adapt history
        setLogs(historyRes.data.map((t: any) => ({
          id: t.Id,
          tokenNumber: t.Token_Number__c,
          time: t.Token_Time__c,
          date: t.Token_Date__c,
          studentId: t.Student__r?.Student_ID__c || '',
          studentName: t.Student__r?.Name || '',
          mealType: t.Meal_Type__c as MealType,
          dietPreference: t.Diet_Preference__c,
          status: t.Status__c
        })));

        // Adapt stats
        const d = dashboardRes.data;
        setStats({
          totalTokensIssued: d.totalTokensIssued,
          totalEligible: d.activeStudents,
          attendanceRate: Math.round((d.totalTokensIssued / (d.activeStudents || 1)) * 100),
          vegCount: d.vegCount,
          vegTarget: Math.round(d.activeStudents * 0.6),
          nonVegCount: d.nonVegCount,
          nonVegTarget: Math.round(d.activeStudents * 0.4),
          flowHourly: []
        });
      } else if (dbUser.role === 'Student') {
        const [meRes, historyRes] = await Promise.all([
          api.get(`/students/${dbUser.studentId}`),
          api.get('/tokens/history')
        ]);
        
        const s = meRes.data;
        setStudents([{
          id: s.Student_ID__c,
          name: s.Name,
          department: s.Department__c || 'Unknown',
          hostelRoom: s.Hostel_Room__c || 'Unknown',
          preference: s.Diet_Preference__c,
          status: s.Status__c,
          photoUrl: s.Photo_URL__c || 'https://via.placeholder.com/150',
          phone: s.Phone__c,
          email: s.Email__c,
          issuedSessionsToday: {}
        }]);

        setLogs(historyRes.data.map((t: any) => ({
          id: t.Id,
          tokenNumber: t.Token_Number__c,
          time: t.Token_Time__c,
          date: t.Token_Date__c,
          studentId: t.Student__r?.Student_ID__c || '',
          studentName: t.Student__r?.Name || '',
          mealType: t.Meal_Type__c as MealType,
          dietPreference: t.Diet_Preference__c,
          status: t.Status__c
        })));
      }
      
      // Fetch menu (simplified for now, ideally format from backend)
      // Since menu formatting is complex in UI, leaving as empty or dummy if not fully mapped
      const menuRes = await api.get('/menu');
      // For now we will keep the UI working by providing basic shape
      const defaultMenu: DailyMenu = {
        Breakfast: { veg: { mainItem: 'Idli', side1: 'Chutney', beverage: 'Tea', extras: [] }, nonVeg: { mainItem: 'Idli', side1: 'Chutney', beverage: 'Tea', extras: [] } },
        Lunch: { veg: { mainItem: 'Meals', side1: 'Poriyal', beverage: 'Water', extras: [] }, nonVeg: { mainItem: 'Chicken Biryani', side1: 'Raita', beverage: 'Water', extras: [] } },
        Snacks: { veg: { mainItem: 'Samosa', side1: 'Sauce', beverage: 'Coffee', extras: [] }, nonVeg: { mainItem: 'Samosa', side1: 'Sauce', beverage: 'Coffee', extras: [] } },
        Dinner: { veg: { mainItem: 'Chapati', side1: 'Kurma', beverage: 'Milk', extras: [] }, nonVeg: { mainItem: 'Egg Parotta', side1: 'Kurma', beverage: 'Milk', extras: [] } }
      };
      setMenu(defaultMenu);
      
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dbUser]);

  // Selected student for token verification/issuance
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
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
  const handleIssueToken = async (student: Student) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    try {
      // Call Backend API
      const res = await api.post('/tokens', {
        studentId: student.id,
        date: dateStr,
        mealType: currentMeal,
        time: timeStr
      });
      
      const tokenNumber = res.data.tokenNumber;
      const tokenId = res.data.id;

      // Update UI stateoptimistically
      const updatedStudent: Student = {
        ...student,
        issuedSessionsToday: {
          ...student.issuedSessionsToday,
          [currentMeal]: {
            tokenId: tokenId,
            tokenNumber: tokenNumber,
            issuedAt: timeStr,
            timestamp: Date.now()
          }
        }
      };

      setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

      // Add to logs
      const newLog: TokenIssuanceLog = {
        id: tokenId,
        tokenNumber: tokenNumber,
        time: timeStr,
        date: dateStr,
        studentId: student.id,
        studentName: student.name,
        mealType: currentMeal,
        dietPreference: student.preference,
        status: 'Issued'
      };

      setLogs((prev) => [newLog, ...prev]);

      // Play audio chime and burst confetti
      playSoundChime('success');
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 }
      });

      // Open slip modal
      setIssuedSlipData({
        student: updatedStudent,
        tokenNumber: tokenNumber,
        issuedAt: timeStr,
        mealType: currentMeal
      });

      // Refresh Stats
      fetchData();
      
    } catch (err: any) {
      playSoundChime('alert');
      alert(err.message || 'Failed to issue token');
    }
  };

  // Admin override to reset session for a student
  const handleResetStudentSession = async (studentId: string) => {
    try {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;
      const session = student.issuedSessionsToday[currentMeal];
      if (session && session.tokenId) {
        await api.delete(`/tokens/${session.tokenId}`);
      }

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
      // Remove from logs
      setLogs((prev) => prev.filter((l) => !(l.studentId === studentId && l.mealType === currentMeal && l.date === new Date().toISOString().split('T')[0])));
      playSoundChime('success');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel session');
    }
  };

  // Register new student handler
  const handleRegisterStudent = async (newStudent: Student) => {
    try {
      await api.post('/students', {
        studentId: newStudent.id,
        name: newStudent.name,
        department: newStudent.department,
        hostelRoom: newStudent.hostelRoom,
        preference: newStudent.preference,
        email: newStudent.email,
        phone: newStudent.phone,
        status: newStudent.status
      });
      setStudents((prev) => [newStudent, ...prev]);
      setSelectedStudentId(newStudent.id);
      setCurrentTab('search');
      playSoundChime('success');
    } catch (err: any) {
      alert(err.message || 'Failed to register student');
    }
  };

  // Save updated menu
  const handleSaveMenu = async (updatedMenu: DailyMenu) => {
    try {
      // In a full implementation, we'd loop through and save each menu item
      // For now we just update frontend state.
      setMenu(updatedMenu);
      playSoundChime('success');
    } catch (err: any) {
      alert(err.message || 'Failed to save menu');
    }
  };

  // Select student and navigate to Search / Issue screen
  const handleSelectStudentForIssue = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentTab('search');
  };

  if (authLoading) {
    return <div className="flex h-screen w-screen items-center justify-center font-bold text-lg">Loading Application...</div>;
  }

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
          if (students.length > 0) {
            setSelectedStudentId(students[0].id);
            setCurrentTab('search');
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-[64px] md:pl-[240px] flex flex-col">
        {loadingData ? (
          <div className="flex-1 flex items-center justify-center font-bold text-gray-500">Loading Dashboard Data...</div>
        ) : (
          <>
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
          </>
        )}
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
