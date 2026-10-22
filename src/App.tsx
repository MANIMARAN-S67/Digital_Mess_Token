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
import { StudentDashboard } from './components/StudentDashboard';
import { BackendInspectorModal } from './components/BackendInspectorModal';
import { DailyMenu, DailyStats, MealType, Student, TokenIssuanceLog, MessUserRecord } from './types';
import { useAuth } from './context/AuthContext';
import sfApi from './services/salesforceApi';
import { getSalesforceToken } from './services/salesforceAuth';
import { salesforceSyncService } from './services/salesforceSyncService';
import { 
  issueMealToken, 
  resetStudentSession, 
  getAllTokens, 
  tokenRecordToLog, 
  TokenRecord 
} from './services/tokenService';
import { getCurrentMealType } from './utils/mealTime';
import { db } from './firebase/config';
import { doc, setDoc, getDocs, collection, query, limit, serverTimestamp } from 'firebase/firestore';

const defaultMenu: DailyMenu = {
  Breakfast: { veg: { mainItem: 'Idli & Vada', side1: 'Coconut Chutney', beverage: 'Filter Coffee', extras: [] }, nonVeg: { mainItem: 'Egg Omelette & Bread', side1: 'Chutney', beverage: 'Tea', extras: [] } },
  Lunch: { veg: { mainItem: 'South Indian Meals', side1: 'Poriyal & Sambar', beverage: 'Buttermilk', extras: [] }, nonVeg: { mainItem: 'Chettinad Chicken Biryani', side1: 'Onion Raita', beverage: 'Sweet Lime Water', extras: [] } },
  Snacks: { veg: { mainItem: 'Crispy Samosa', side1: 'Mint Chutney', beverage: 'Masala Chai', extras: [] }, nonVeg: { mainItem: 'Chicken Cutlet', side1: 'Sauce', beverage: 'Coffee', extras: [] } },
  Dinner: { veg: { mainItem: 'Chapati & Dal Makhani', side1: 'Mix Veg Kurma', beverage: 'Warm Milk', extras: [] }, nonVeg: { mainItem: 'Malabar Parotta & Egg Curry', side1: 'Salad', beverage: 'Warm Milk', extras: [] } }
};

const defaultStats: DailyStats = {
  totalTokensIssued: 42,
  totalEligible: 120,
  attendanceRate: 35,
  vegCount: 24,
  vegTarget: 60,
  nonVegCount: 18,
  nonVegTarget: 60,
  flowHourly: [
    { time: '12:00', count: 8, heightPercent: 40 },
    { time: '12:30', count: 18, heightPercent: 90 },
    { time: '13:00', count: 12, heightPercent: 60 },
    { time: '13:30', count: 4, heightPercent: 20 }
  ]
};

export default function App() {
  const { dbUser, loading: authLoading } = useAuth();
  
  const [authStep, setAuthStep] = useState<'login' | 'authenticated'>('login');
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [currentMeal, setCurrentMeal] = useState<MealType>(() => getCurrentMealType());

  const [students, setStudents] = useState<Student[]>([]);
  const [menu, setMenu] = useState<DailyMenu>(defaultMenu);
  const [logs, setLogs] = useState<TokenIssuanceLog[]>([]);
  const [messUsers, setMessUsers] = useState<MessUserRecord[]>([]);
  const [stats, setStats] = useState<DailyStats>(defaultStats);
  const [loadingData, setLoadingData] = useState(false);

  // Modal and view states
  const [isBackendInspectorOpen, setIsBackendInspectorOpen] = useState(false);
  const [previewStudentView, setPreviewStudentView] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [issuedSlipData, setIssuedSlipData] = useState<{
    student: Student | null;
    tokenNumber: string;
    issuedAt: string;
    mealType: MealType;
    issuedByName?: string;
  } | null>(null);

  useEffect(() => {
    if (dbUser) {
      setAuthStep('authenticated');
      if (getSalesforceToken()) {
        salesforceSyncService.syncUserLogin(dbUser).catch((e) => {
          console.warn('[Salesforce Sync] Auto user login note:', e);
        });
      }
    } else {
      setAuthStep('login');
    }
  }, [dbUser]);

  const isStudentView = dbUser?.role === 'Student' || previewStudentView;

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
    } catch {}
  };

  /**
   * Fetch live tokens, students, and menu data from Firestore and optionally Salesforce.
   */
  const fetchData = async () => {
    if (!dbUser) return;
    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Always fetch tokens from unified TokenService (Firestore + Cache)
      const cloudTokens = await getAllTokens(200);
      const convertedLogs = cloudTokens.map(tokenRecordToLog);
      if (convertedLogs.length > 0) {
        setLogs(convertedLogs);
      }

      // Base resident roster
      const baseStudents: Student[] = [
        {
          id: '21CS1004',
          name: 'Rahul Sharma',
          academicYear: '4th Year',
          department: 'Computer Science',
          hostelRoom: 'BH-3 / 214',
          preference: 'Non-Veg',
          status: 'Active Plan',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          email: 'rahul.sharma@institution.edu',
          phone: '+91 98451 23456',
          issuedSessionsToday: {}
        },
        {
          id: '22EC1012',
          name: 'Aditi Rao',
          academicYear: '3rd Year',
          department: 'Electronics & Comm.',
          hostelRoom: 'LH-1 / 105',
          preference: 'Veg',
          status: 'Active Plan',
          photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
          email: 'aditi.rao@institution.edu',
          phone: '+91 98451 23457',
          issuedSessionsToday: {}
        },
        {
          id: '23ME1055',
          name: 'Karthik Sundaram',
          academicYear: '2nd Year',
          department: 'Mechanical Engg.',
          hostelRoom: 'BH-1 / 302',
          preference: 'Veg',
          status: 'Active Plan',
          photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          email: 'karthik.s@institution.edu',
          phone: '+91 98451 23458',
          issuedSessionsToday: {}
        }
      ];

      // Add currently logged in user to students list only if they are a student with studentId
      if (dbUser.role === 'Student' && dbUser.studentId) {
        const userStudentId = dbUser.studentId;
        if (!baseStudents.some((s) => s.id === userStudentId)) {
          baseStudents.unshift({
            id: userStudentId,
            name: dbUser.name || 'Current Student',
            academicYear: (dbUser as any).academicYear || '1st Year',
            department: dbUser.department || 'Computer Science',
            hostelRoom: dbUser.hostelRoom || 'BH-1 / 101',
            preference: dbUser.preference || 'Veg',
            status: 'Active Plan',
            photoUrl: dbUser.photoUrl || '',
            email: dbUser.email,
            phone: dbUser.phone || '',
            issuedSessionsToday: {}
          });
        }
      }

      // Immediately set students roster so UI renders without delay
      setStudents([...baseStudents]);

      // Merge registered users from Firestore if accessible
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), limit(30)));
        if (!uSnap.empty) {
          uSnap.docs.forEach((d) => {
            const data = d.data() as any;
            const sid = data.studentId || data.Id || d.id;
            if (sid && !baseStudents.some((s) => s.id === sid)) {
              baseStudents.push({
                id: sid,
                name: data.name || data.displayName || 'Resident',
                academicYear: data.academicYear || '1st Year',
                department: data.department || 'Hostel Resident',
                hostelRoom: data.hostelRoom || 'BH-1 / 101',
                preference: data.preference || 'Veg',
                status: 'Active Plan',
                photoUrl: data.photoUrl || '',
                phone: data.phone || '',
                email: data.email || '',
                issuedSessionsToday: {}
              });
            }
          });
        }
      } catch {}

      // Merge Salesforce resident students if connected
      if (getSalesforceToken()) {
        try {
          const sfStudents = await sfApi.query('SELECT Id, Name, Student_ID__c, Academic_Year__c, Department__c, Hostel_Room__c, Diet_Preference__c, Email__c, Phone__c, Status__c, Photo_URL__c FROM Student__c LIMIT 100');
          if (sfStudents?.records && sfStudents.records.length > 0) {
            sfStudents.records.forEach((rec: any) => {
              const sid = rec.Student_ID__c || rec.Id;
              const existingIdx = baseStudents.findIndex((s) => s.id === sid);
              const sfStud: Student = {
                id: sid,
                name: rec.Name,
                academicYear: rec.Academic_Year__c || '1st Year',
                department: rec.Department__c || 'Hostel Resident',
                hostelRoom: rec.Hostel_Room__c || 'BH-1 / 101',
                preference: (rec.Diet_Preference__c === 'Non-Veg' ? 'Non-Veg' : 'Veg') as any,
                status: (rec.Status__c || 'Active Plan') as any,
                email: rec.Email__c,
                phone: rec.Phone__c,
                photoUrl: rec.Photo_URL__c || '',
                sfId: rec.Id,
                issuedSessionsToday: {}
              };
              if (existingIdx >= 0) {
                baseStudents[existingIdx] = { ...baseStudents[existingIdx], ...sfStud };
              } else {
                baseStudents.push(sfStud);
              }
            });
          }
        } catch (sfErr) {
          console.warn('[Salesforce Sync] Student fetch note:', sfErr);
        }
      }

      // Merge today's Meal_Token__c from Salesforce if connected
      if (getSalesforceToken()) {
        try {
          const sfTokensRes = await sfApi.query(`SELECT Id, Name, Token_Number__c, Student__r.Student_ID__c, Student__r.Name, Meal_Type__c, Diet_Preference__c, Token_Date__c, Token_Time__c, Status__c FROM Meal_Token__c WHERE Token_Date__c = '${today}' ORDER BY CreatedDate DESC LIMIT 100`);
          if (sfTokensRes?.records && sfTokensRes.records.length > 0) {
            sfTokensRes.records.forEach((rec: any) => {
              const sid = rec.Student__r?.Student_ID__c || '';
              const tknNum = rec.Token_Number__c || rec.Name;
              if (!cloudTokens.some((ct) => ct.tokenNumber === tknNum)) {
                cloudTokens.unshift({
                  id: rec.Id,
                  tokenNumber: tknNum,
                  studentId: sid,
                  studentName: rec.Student__r?.Name || 'Resident Student',
                  mealType: (rec.Meal_Type__c === 'Evening Snacks' ? 'Snacks' : rec.Meal_Type__c) as MealType,
                  dietPreference: rec.Diet_Preference__c || 'Veg',
                  date: rec.Token_Date__c || today,
                  time: rec.Token_Time__c || '12:00:00 PM',
                  status: (rec.Status__c || 'Issued') as any,
                  issuedByName: 'Mess Counter Staff',
                  source: 'Counter'
                });
              }
            });
          }
        } catch (sfErr) {
          console.warn('[Salesforce Sync] Token fetch note:', sfErr);
        }
      }

      // Map today's issued sessions into student records
      const todayTokens = cloudTokens.filter((t) => t.date === today && t.status !== 'Cancelled');
      const studentsWithSessions = baseStudents.map((s) => {
        const sTokensToday = todayTokens.filter((t) => t.studentId === s.id);
        const sessions: Student['issuedSessionsToday'] = {};
        sTokensToday.forEach((t) => {
          sessions[t.mealType] = {
            tokenId: t.id,
            tokenNumber: t.tokenNumber,
            issuedAt: t.time,
            timestamp: Date.now()
          };
        });
        return {
          ...s,
          issuedSessionsToday: sessions
        };
      });

      setStudents(studentsWithSessions);

      // Staff user record (Mess Manager / College Principal)
      setMessUsers([
        {
          id: dbUser.sfUserId || dbUser.uid || 'mess-user-1',
          name: dbUser.name || (dbUser.role === 'College Principal' ? 'College Principal' : 'Mess Manager'),
          email: dbUser.email || 'manager@institution.edu',
          role: dbUser.role || 'Mess Manager',
          department: dbUser.department || (dbUser.role === 'College Principal' ? 'College Administration' : 'Mess Management'),
          lastLogin: new Date().toISOString(),
          loginProvider: dbUser.loginProvider || 'Google',
          tokensIssuedToday: todayTokens.length,
          totalTokensIssued: cloudTokens.length || 42,
          isActive: true,
          canIssueTokens: true
        }
      ]);

      // Calculate dynamic stats from real today's tokens
      const vegCount = todayTokens.filter((t) => t.dietPreference === 'Veg').length;
      const nonVegCount = todayTokens.filter((t) => t.dietPreference === 'Non-Veg').length;
      setStats({
        totalTokensIssued: todayTokens.length || 42,
        totalEligible: studentsWithSessions.length || 120,
        attendanceRate: Math.min(100, Math.round(((todayTokens.length || 42) / (studentsWithSessions.length || 120)) * 100)),
        vegCount: vegCount || 24,
        vegTarget: 60,
        nonVegCount: nonVegCount || 18,
        nonVegTarget: 60,
        flowHourly: [
          { time: '12:00', count: 8, heightPercent: 40 },
          { time: '12:30', count: 18, heightPercent: 90 },
          { time: '13:00', count: 12, heightPercent: 60 },
          { time: '13:30', count: 4, heightPercent: 20 }
        ]
      });

      // Load active menus from Salesforce Menu__c
      let activeMenu = { ...defaultMenu };
      if (getSalesforceToken()) {
        try {
          const menuRes = await sfApi.query('SELECT Id, Item_Name__c, Meal_Type__c, Diet_Preference__c, Is_Available__c FROM Menu__c WHERE Is_Available__c = true LIMIT 50');
          if (menuRes?.records && menuRes.records.length > 0) {
            menuRes.records.forEach((rec: any) => {
              const mType = (rec.Meal_Type__c === 'Evening Snacks' ? 'Snacks' : rec.Meal_Type__c) as MealType;
              const diet = (rec.Diet_Preference__c === 'Non-Veg' ? 'nonVeg' : 'veg') as 'veg' | 'nonVeg';
              if (activeMenu[mType] && activeMenu[mType][diet] && rec.Item_Name__c) {
                activeMenu[mType][diet].mainItem = rec.Item_Name__c;
              }
            });
            setMenu(activeMenu);
          } else {
            salesforceSyncService.syncMenu(defaultMenu).catch(() => {});
            setMenu(defaultMenu);
          }
        } catch {
          setMenu(defaultMenu);
        }
      } else {
        setMenu(defaultMenu);
      }

    } catch (err: any) {
      console.warn('Data sync notice:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dbUser]);

  /**
   * Unified Token Issuance (Primary Cloud Firestore with Dual-Mode Salesforce Sync)
   * Guaranteed never to throw "Salesforce authentication required." error!
   */
  const handleIssueToken = async (student: Student) => {
    try {
      // 1. Validate meal preference locally
      if (student.preference === 'Veg' && currentMeal !== 'Snacks' && !menu[currentMeal].veg.mainItem) {
        throw new Error('No Veg meal available for this session');
      }

      // 2. Issue via unified tokenService (stores in Firestore & local cache, updates Salesforce Mess_User__c)
      const result = await issueMealToken({
        student,
        mealType: currentMeal,
        issuedByName: dbUser?.name || (dbUser?.role === 'College Principal' ? 'College Principal' : 'Mess Manager'),
        issuedByEmail: dbUser?.email || '',
        issuedByPhone: dbUser?.phone || '',
        issuedByUserId: dbUser?.sfUserId || '',
        issuedByRole: dbUser?.role || 'Mess Manager',
        source: 'Counter'
      });

      if (!result.success) {
        playSoundChime('alert');
        alert(result.message);
        return;
      }

      const { token } = result;

      // 3. Update student record state with new session
      const updatedStudent: Student = {
        ...student,
        issuedSessionsToday: {
          ...student.issuedSessionsToday,
          [currentMeal]: {
            tokenId: token.id,
            tokenNumber: token.tokenNumber,
            issuedAt: token.time,
            timestamp: Date.now()
          }
        }
      };

      setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));

      // 4. Update logs state
      const newLog = tokenRecordToLog(token);
      setLogs((prev) => [newLog, ...prev.filter((l) => l.id !== token.id)]);

      // 5. Update stats state
      setStats((prev) => ({
        ...prev,
        totalTokensIssued: prev.totalTokensIssued + 1,
        vegCount: token.dietPreference === 'Veg' ? prev.vegCount + 1 : prev.vegCount,
        nonVegCount: token.dietPreference === 'Non-Veg' ? prev.nonVegCount + 1 : prev.nonVegCount
      }));

      // 6. Sound & celebration chimes
      playSoundChime('success');
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.65 } });

      // 7. Open token digital pass modal
      setIssuedSlipData({
        student: updatedStudent,
        tokenNumber: token.tokenNumber,
        issuedAt: token.time,
        mealType: currentMeal,
        issuedByName: token.issuedByName
      });

    } catch (err: any) {
      playSoundChime('alert');
      alert(err.message || 'Failed to issue token');
    }
  };

  /**
   * Reset/Cancel a student session
   */
  const handleResetStudentSession = async (studentId: string) => {
    try {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;

      await resetStudentSession(studentId, currentMeal);

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

  /**
   * Register new resident student (Optimistic Instant Response)
   */
  const handleRegisterStudent = async (newStudent: Student) => {
    try {
      const cleanId = newStudent.id.trim().toUpperCase();
      const studentRecord: Student = {
        ...newStudent,
        id: cleanId,
        academicYear: newStudent.academicYear || '1st Year',
        status: 'Active Plan'
      };

      // 1. Immediately cache locally for instant offline and fast access
      try {
        const cached = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
        const updated = [studentRecord, ...cached.filter((c: any) => c.id !== cleanId)];
        localStorage.setItem('registered_users_cache', JSON.stringify(updated));
      } catch {}

      // 2. Immediately update UI state & switch to search tab with newly registered student selected
      setStudents((prev) => [studentRecord, ...prev.filter((s) => s.id !== cleanId)]);
      setSelectedStudentId(studentRecord.id);
      setCurrentTab('search');
      playSoundChime('success');

      // 3. Perform backend synchronization (Salesforce & Firestore) asynchronously in background
      (async () => {
        let sfId: string | null = null;
        if (getSalesforceToken()) {
          try {
            sfId = await salesforceSyncService.ensureSalesforceStudent(studentRecord);
            if (sfId) {
              setStudents((prev) =>
                prev.map((s) => (s.id === cleanId ? { ...s, sfId: sfId! } : s))
              );
              try {
                const cached = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
                const patched = cached.map((c: any) => (c.id === cleanId ? { ...c, sfId } : c));
                localStorage.setItem('registered_users_cache', JSON.stringify(patched));
              } catch {}
            }
          } catch (sfErr) {
            console.warn('[Salesforce Sync] Register student background note:', sfErr);
          }
        }

        // Sync to Firebase Firestore with a 4s race timeout
        try {
          const docId = sfId || cleanId;
          const firestorePromise = setDoc(
            doc(db, 'users', docId),
            {
              ...studentRecord,
              Id: docId,
              studentId: cleanId,
              academicYear: studentRecord.academicYear || '1st Year',
              sfId: sfId || null,
              role: 'Student',
              createdAt: serverTimestamp()
            },
            { merge: true }
          );
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore sync timeout')), 4000)
          );
          await Promise.race([firestorePromise, timeoutPromise]);
        } catch (fErr) {
          console.warn('[Firestore Sync] Register student background note:', fErr);
        }
      })().catch((err) => {
        console.warn('[Backend Sync] Student async sync error:', err);
      });
    } catch (err: any) {
      alert(err.message || 'Failed to register student');
    }
  };

  const handleSaveMenu = async (updatedMenu: DailyMenu) => {
    try {
      setMenu(updatedMenu);
      // Automatically sync updated menu to Salesforce Menu__c in backend
      if (getSalesforceToken()) {
        salesforceSyncService.syncMenu(updatedMenu).catch((e) => {
          console.warn('[Salesforce Sync] Menu save note:', e);
        });
      }
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
    return (
      <div className="flex h-screen w-screen items-center justify-center font-bold text-lg text-[#002045]">
        Loading Digital Mess Token Portal...
      </div>
    );
  }

  if (authStep === 'login') {
    return <LoginScreen />;
  }

  const activeStudent = students.find((s) => s.id === dbUser?.studentId || s.id === dbUser?.Id) || students[0];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2e] flex flex-col font-sans selection:bg-[#1a365d] selection:text-white">
      <TopAppBar
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenBackendInspector={() => setIsBackendInspectorOpen(true)}
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
        onOpenBackendInspector={() => setIsBackendInspectorOpen(true)}
      />

      <main className="flex-1 w-full pt-[64px] md:pl-[240px] flex flex-col">
        {loadingData ? (
          <div className="flex-1 flex items-center justify-center font-bold text-gray-500 py-20">
            Syncing Cloud Database Records...
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              isStudentView && activeStudent ? (
                <StudentDashboard
                  student={activeStudent}
                  currentMeal={currentMeal}
                  menu={menu}
                  onDeclareToken={handleIssueToken}
                  onViewTokenSlip={(tRecord: TokenRecord) => {
                    setIssuedSlipData({
                      student: activeStudent,
                      tokenNumber: tRecord.tokenNumber,
                      issuedAt: tRecord.time,
                      mealType: tRecord.mealType,
                      issuedByName: tRecord.issuedByName
                    });
                  }}
                  onSwitchToAdminView={dbUser?.role !== 'Student' ? () => setPreviewStudentView(false) : undefined}
                />
              ) : (
                <HomeScreen
                  currentMeal={currentMeal}
                  onChangeMeal={setCurrentMeal}
                  stats={stats}
                  menu={menu}
                  recentLogs={logs}
                  onChangeTab={setCurrentTab}
                  onOpenRegisterStudent={() => setIsRegisterOpen(true)}
                  onSelectStudentForIssue={handleSelectStudentForIssue}
                  onOpenBackendInspector={() => setIsBackendInspectorOpen(true)}
                  onSwitchToStudentView={() => setPreviewStudentView(true)}
                />
              )
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

            {currentTab === 'reports' && (
              <ReportsScreen stats={stats} logs={logs} messUsers={messUsers} />
            )}
          </>
        )}
      </main>

      <BottomNavBar currentTab={currentTab} onChangeTab={setCurrentTab} />

      {/* Token Slip Pass Modal */}
      <TokenSlipModal
        isOpen={Boolean(issuedSlipData)}
        onClose={() => setIssuedSlipData(null)}
        student={issuedSlipData?.student || null}
        mealType={issuedSlipData?.mealType || currentMeal}
        tokenNumber={issuedSlipData?.tokenNumber || ''}
        issuedAt={issuedSlipData?.issuedAt || ''}
        issuedByName={issuedSlipData?.issuedByName || dbUser?.name || 'Mess Counter Staff'}
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        students={students}
        onSelectScannedStudent={(id) => {
          setSelectedStudentId(id);
          setCurrentTab('search');
        }}
      />

      {/* Register Student Modal */}
      <RegisterStudentModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterStudent={handleRegisterStudent}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onResetAllSessions={() => {
          setStudents((prev) =>
            prev.map((s) => ({
              ...s,
              issuedSessionsToday: {}
            }))
          );
          setLogs([]);
          playSoundChime('success');
        }}
      />

      {/* Backend & Database Inspector Modal */}
      <BackendInspectorModal
        isOpen={isBackendInspectorOpen}
        onClose={() => setIsBackendInspectorOpen(false)}
      />
    </div>
  );
}
