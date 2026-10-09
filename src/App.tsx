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
import { DailyMenu, DailyStats, MealType, Student, TokenIssuanceLog } from './types';
import { useAuth } from './context/AuthContext';
import sfApi from './services/salesforceApi';

export default function App() {
  const { dbUser, loading: authLoading } = useAuth();
  
  const [authStep, setAuthStep] = useState<'login' | 'authenticated'>('login');
  
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
  const [menu, setMenu] = useState<DailyMenu>({} as DailyMenu);
  const [logs, setLogs] = useState<TokenIssuanceLog[]>([]);
  const [stats, setStats] = useState<DailyStats>({} as DailyStats);
  const [loadingData, setLoadingData] = useState(false);

  const fetchData = async () => {
    if (!dbUser) return;
    setLoadingData(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      if (['Admin', 'Warden', 'Mess Management'].includes(dbUser.role)) {
        // Parallel queries to Salesforce
        const [studentsRes, historyRes, menuRes, tokensTodayRes] = await Promise.all([
          sfApi.query('SELECT Id, Name, Student_ID__c, Department__c, Hostel_Room__c, Diet_Preference__c, Email__c FROM Student__c'),
          sfApi.query('SELECT Id, Name, Student__r.Id, Student__r.Name, Token_Date__c, Meal_Type__c, Status__c, Token_Number__c FROM Meal_Token__c ORDER BY CreatedDate DESC LIMIT 100'),
          sfApi.query(`SELECT Id, Name, Menu_Date__c, Meal_Type__c, Item_Name__c, Diet_Preference__c FROM Menu__c WHERE Menu_Date__c = ${today}`),
          sfApi.query(`SELECT Id, Meal_Type__c FROM Meal_Token__c WHERE Token_Date__c = ${today}`)
        ]);
        
        setStudents(studentsRes.records.map((s: any) => ({
          id: s.Id,
          name: s.Name,
          department: s.Department__c || 'Unknown',
          hostelRoom: s.Hostel_Room__c || 'Unknown',
          preference: s.Diet_Preference__c,
          status: 'Active Plan',
          photoUrl: 'https://via.placeholder.com/150',
          phone: '',
          email: s.Email__c,
          issuedSessionsToday: {} 
        })));
        
        setLogs(historyRes.records.map((t: any) => ({
          id: t.Id,
          tokenNumber: t.Token_Number__c || t.Id,
          time: new Date(t.Token_Date__c).toLocaleTimeString(),
          date: t.Token_Date__c,
          studentId: t.Student__r?.Id || '',
          studentName: t.Student__r?.Name || '',
          mealType: t.Meal_Type__c as MealType,
          dietPreference: 'Veg', // would join or lookup
          status: t.Status__c || 'Issued'
        })));

        const totalTokens = tokensTodayRes.records.length;
        setStats({
          totalTokensIssued: totalTokens,
          totalEligible: studentsRes.records.length,
          attendanceRate: studentsRes.records.length ? Math.round((totalTokens / studentsRes.records.length) * 100) : 0,
          vegCount: 0,
          vegTarget: 0,
          nonVegCount: 0,
          nonVegTarget: 0,
          flowHourly: []
        });

      } else if (dbUser.role === 'Student') {
        const historyRes = await sfApi.query(`SELECT Id, Name, Student__r.Id, Student__r.Name, Token_Date__c, Meal_Type__c, Status__c, Token_Number__c FROM Meal_Token__c WHERE Student__c = '${dbUser.studentId}' ORDER BY CreatedDate DESC LIMIT 50`);
        
        setStudents([{
          id: dbUser.studentId,
          name: dbUser.name,
          department: dbUser.department || 'Unknown',
          hostelRoom: dbUser.hostelRoom || 'Unknown',
          preference: dbUser.preference,
          status: 'Active Plan',
          photoUrl: 'https://via.placeholder.com/150',
          phone: '',
          email: dbUser.email,
          issuedSessionsToday: {}
        }]);

        setLogs(historyRes.records.map((t: any) => ({
          id: t.Id,
          tokenNumber: t.Token_Number__c || t.Id,
          time: new Date(t.Token_Date__c).toLocaleTimeString(),
          date: t.Token_Date__c,
          studentId: t.Student__r?.Id || '',
          studentName: t.Student__r?.Name || '',
          mealType: t.Meal_Type__c as MealType,
          dietPreference: dbUser.preference,
          status: t.Status__c || 'Issued'
        })));
      }
      
      const defaultMenu: DailyMenu = {
        Breakfast: { veg: { mainItem: 'Idli', side1: 'Chutney', beverage: 'Tea', extras: [] }, nonVeg: { mainItem: 'Idli', side1: 'Chutney', beverage: 'Tea', extras: [] } },
        Lunch: { veg: { mainItem: 'Meals', side1: 'Poriyal', beverage: 'Water', extras: [] }, nonVeg: { mainItem: 'Chicken Biryani', side1: 'Raita', beverage: 'Water', extras: [] } },
        Snacks: { veg: { mainItem: 'Samosa', side1: 'Sauce', beverage: 'Coffee', extras: [] }, nonVeg: { mainItem: 'Samosa', side1: 'Sauce', beverage: 'Coffee', extras: [] } },
        Dinner: { veg: { mainItem: 'Chapati', side1: 'Kurma', beverage: 'Milk', extras: [] }, nonVeg: { mainItem: 'Egg Parotta', side1: 'Kurma', beverage: 'Milk', extras: [] } }
      };
      setMenu(defaultMenu);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dbUser]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [messHall, setMessHall] = useState('Central Mess Hall A');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [issuedSlipData, setIssuedSlipData] = useState<{
    student: Student | null;
    tokenNumber: string;
    issuedAt: string;
    mealType: MealType;
  } | null>(null);

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
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
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
    } catch (err) {}
  };

  const handleIssueToken = async (student: Student) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    try {
      // Validate meal preference locally (backend should also validate via Apex/Flow)
      if (student.preference === 'Veg' && currentMeal !== 'Snacks' && !menu[currentMeal].veg.mainItem) {
        throw new Error('No Veg meal available');
      }

      // Check if token already exists
      const existingTokenQuery = await sfApi.query(`SELECT Id FROM Meal_Token__c WHERE Student__c = '${student.id}' AND Token_Date__c = ${dateStr} AND Meal_Type__c = '${currentMeal}'`);
      if (existingTokenQuery.records.length > 0) {
        throw new Error('You have already received this meal token today.');
      }

      // Create Meal_Token__c in Salesforce
      const tokenCreateRes = await sfApi.post('/sobjects/Meal_Token__c', {
        Student__c: student.id,
        Token_Date__c: dateStr,
        Meal_Type__c: currentMeal,
        Status__c: 'Issued',
        Token_Time__c: timeStr
      });

      const tokenId = tokenCreateRes.id;
      const tokenNumber = 'TKN-' + tokenId.slice(-5).toUpperCase();

      // Update token number back in Salesforce for tracking if necessary
      await sfApi.patch(`/sobjects/Meal_Token__c/${tokenId}`, {
        Token_Number__c: tokenNumber
      });
      
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

      playSoundChime('success');
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } });

      setIssuedSlipData({
        student: updatedStudent,
        tokenNumber: tokenNumber,
        issuedAt: timeStr,
        mealType: currentMeal
      });

      fetchData();
      
    } catch (err: any) {
      playSoundChime('alert');
      alert(err.message || 'Failed to issue token');
    }
  };

  const handleResetStudentSession = async (studentId: string) => {
    try {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;
      const session = student.issuedSessionsToday[currentMeal];
      if (session && session.tokenId) {
        await sfApi.delete(`/sobjects/Meal_Token__c/${session.tokenId}`);
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
      setLogs((prev) => prev.filter((l) => !(l.studentId === studentId && l.mealType === currentMeal && l.date === new Date().toISOString().split('T')[0])));
      playSoundChime('success');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel session');
    }
  };

  const handleRegisterStudent = async (newStudent: Student) => {
    try {
      const res = await sfApi.post('/sobjects/Student__c', {
        Name: newStudent.name,
        Department__c: newStudent.department,
        Hostel_Room__c: newStudent.hostelRoom,
        Diet_Preference__c: newStudent.preference,
        Email__c: newStudent.email
      });
      newStudent.id = res.id;
      setStudents((prev) => [newStudent, ...prev]);
      setSelectedStudentId(newStudent.id);
      setCurrentTab('search');
      playSoundChime('success');
    } catch (err: any) {
      alert(err.message || 'Failed to register student');
    }
  };

  const handleSaveMenu = async (updatedMenu: DailyMenu) => {
    try {
      setMenu(updatedMenu);
      playSoundChime('success');
    } catch (err: any) {
      alert(err.message || 'Failed to save menu');
    }
  };

  const handleSelectStudentForIssue = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentTab('search');
  };

  if (authLoading) {
    return <div className="flex h-screen w-screen items-center justify-center font-bold text-lg">Loading Application...</div>;
  }

  if (authStep === 'login') {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2e] flex flex-col font-sans selection:bg-[#1a365d] selection:text-white">
      <TopAppBar
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={2}
      />

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

      <BottomNavBar currentTab={currentTab} onChangeTab={setCurrentTab} />

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
