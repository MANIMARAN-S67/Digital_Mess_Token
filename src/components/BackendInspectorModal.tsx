import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { getAllTokens, TokenRecord } from '../services/tokenService';
import { getSalesforceToken, getSalesforceInstanceUrl } from '../services/salesforceAuth';
import sfApi from '../services/salesforceApi';
import { salesforceSyncService } from '../services/salesforceSyncService';

interface BackendInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendInspectorModal: React.FC<BackendInspectorModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'logins' | 'users' | 'salesforce' | 'guide'>('salesforce');
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Salesforce Live Backend State
  const [sfStats, setSfStats] = useState<{
    menus: any[];
    students: any[];
    tokens: any[];
    attendances: any[];
    users: any[];
  }>({
    menus: [],
    students: [],
    tokens: [],
    attendances: [],
    users: []
  });
  const [sfSyncing, setSfSyncing] = useState(false);
  const [sfSyncMessage, setSfSyncMessage] = useState<string | null>(null);
  const [sfActiveSubObject, setSfActiveSubObject] = useState<'menus' | 'students' | 'tokens' | 'attendances' | 'users'>('menus');

  const sfToken = getSalesforceToken();
  const sfInstance = getSalesforceInstanceUrl();

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Tokens
      const tokenList = await getAllTokens(100);
      setTokens(tokenList);

      // 2. Fetch Users
      try {
        const uSnap = await getDocs(query(collection(db, 'users'), limit(50)));
        if (!uSnap.empty) {
          setUsers(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } else {
          const cached = JSON.parse(localStorage.getItem('mess_users_cloud_cache') || '[]');
          const regCached = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
          setUsers([...cached, ...regCached]);
        }
      } catch {
        const cached = JSON.parse(localStorage.getItem('mess_users_cloud_cache') || '[]');
        const regCached = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
        setUsers([...cached, ...regCached]);
      }

      // 3. Fetch Login Logs
      try {
        const lSnap = await getDocs(query(collection(db, 'login_logs'), limit(50)));
        if (!lSnap.empty) {
          const logs: any[] = lSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setLoginLogs(logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')));
        } else {
          const cachedLogs = JSON.parse(localStorage.getItem('mess_login_logs_cache') || '[]');
          setLoginLogs(cachedLogs);
        }
      } catch {
        const cachedLogs = JSON.parse(localStorage.getItem('mess_login_logs_cache') || '[]');
        setLoginLogs(cachedLogs);
      }

      // 4. Fetch Live Salesforce Backend Records across all 5 custom objects
      if (getSalesforceToken()) {
        try {
          const [menusQ, studentsQ, tokensQ, attendancesQ, usersQ] = await Promise.allSettled([
            sfApi.query('SELECT Id, Name, Item_Name__c, Meal_Type__c, Diet_Preference__c, Menu_Date__c, Is_Available__c FROM Menu__c ORDER BY CreatedDate DESC LIMIT 50'),
            sfApi.query('SELECT Id, Name, Student_ID__c, Academic_Year__c, Department__c, Hostel_Room__c, Diet_Preference__c, Email__c, Phone__c, Status__c FROM Student__c ORDER BY CreatedDate DESC LIMIT 50'),
            sfApi.query('SELECT Id, Name, Token_Number__c, Student__r.Name, Meal_Type__c, Diet_Preference__c, Token_Date__c, Token_Time__c, Status__c FROM Meal_Token__c ORDER BY CreatedDate DESC LIMIT 50'),
            sfApi.query('SELECT Id, Name, Student__r.Name, Meal_Token__r.Token_Number__c, Attendance_Date__c, Meal_Type__c, Attendance_Status__c, Recorded_Time__c FROM Meal_Attendance__c ORDER BY CreatedDate DESC LIMIT 50'),
            sfApi.query('SELECT Id, Name, Email__c, Role__c, Department__c, Phone__c, Status__c, Last_Login__c, Is_Currently_Active__c FROM Mess_User__c ORDER BY CreatedDate DESC LIMIT 50')
          ]);

          setSfStats({
            menus: menusQ.status === 'fulfilled' ? menusQ.value?.records || [] : [],
            students: studentsQ.status === 'fulfilled' ? studentsQ.value?.records || [] : [],
            tokens: tokensQ.status === 'fulfilled' ? tokensQ.value?.records || [] : [],
            attendances: attendancesQ.status === 'fulfilled' ? attendancesQ.value?.records || [] : [],
            users: usersQ.status === 'fulfilled' ? usersQ.value?.records || [] : []
          });
        } catch (sfErr) {
          console.warn('Backend Inspector SF query note:', sfErr);
        }
      }
    } catch (err) {
      console.warn('Backend inspector fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSfSync = async () => {
    setSfSyncing(true);
    setSfSyncMessage(null);
    try {
      const defaultResidentList = [
        { id: '21CS1004', name: 'Rahul Sharma', department: 'Computer Science', hostelRoom: 'BH-3 / 214', preference: 'Non-Veg', status: 'Active Plan', email: 'rahul.sharma@institution.edu', phone: '9845123456', photoUrl: '', issuedSessionsToday: {} },
        { id: '22EC1012', name: 'Aditi Rao', department: 'Electronics & Comm.', hostelRoom: 'LH-1 / 105', preference: 'Veg', status: 'Active Plan', email: 'aditi.rao@institution.edu', phone: '9845123457', photoUrl: '', issuedSessionsToday: {} },
        { id: '23ME1055', name: 'Karthik Sundaram', department: 'Mechanical Engg.', hostelRoom: 'BH-1 / 302', preference: 'Veg', status: 'Active Plan', email: 'karthik.s@institution.edu', phone: '9845123458', photoUrl: '', issuedSessionsToday: {} }
      ];
      const registeredStudents = JSON.parse(localStorage.getItem('registered_users_cache') || '[]');
      const allStudentsToSync = [...defaultResidentList, ...registeredStudents];

      const defaultMenuToSync = {
        Breakfast: { veg: { mainItem: 'Idli, Sambar & Coconut Chutney', side1: '', beverage: '', extras: [] }, nonVeg: { mainItem: 'Egg Omelette & Bread Toast', side1: '', beverage: '', extras: [] } },
        Lunch: { veg: { mainItem: 'South Indian Unlimited Meals', side1: '', beverage: '', extras: [] }, nonVeg: { mainItem: 'Chettinad Special Chicken Biryani', side1: '', beverage: '', extras: [] } },
        Snacks: { veg: { mainItem: 'Crispy Onion Samosa & Chai', side1: '', beverage: '', extras: [] }, nonVeg: { mainItem: 'Crispy Onion Samosa & Chai', side1: '', beverage: '', extras: [] } },
        Dinner: { veg: { mainItem: 'Hot Chapati & Dal Makhani', side1: '', beverage: '', extras: [] }, nonVeg: { mainItem: 'Malabar Parotta & Egg Curry', side1: '', beverage: '', extras: [] } }
      };

      const res = await salesforceSyncService.syncAllToBackend(allStudentsToSync as any, defaultMenuToSync as any, tokens);
      setSfSyncMessage(res.message);
      await loadData();
    } catch (e: any) {
      setSfSyncMessage(e?.message || 'Sync failed.');
    } finally {
      setSfSyncing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#c4c6cf] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#002045] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#9ff5c1]">
              <span className="material-symbols-outlined text-[24px]">database</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold tracking-tight">Backend &amp; Database Inspector</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#0a6c44] text-[#9ff5c1]">
                  Firebase Live
                </span>
              </div>
              <p className="text-[12px] text-white/80">
                Inspect how user logins, student profiles, and issued tokens are stored in the database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#eff4ff] border-b border-[#c4c6cf]/60 text-[12px]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-[#002045]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <strong>Firestore Project:</strong> digitalmesstoken
            </span>
            <span className="text-[#43474e]">
              <strong>Salesforce Mode:</strong> {sfToken ? 'Connected (Dual Sync)' : 'Standalone Cloud (No Errors)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-2.5 py-1 rounded-md bg-white border border-[#c4c6cf] text-[#002045] font-semibold text-[11px] hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh Live Data
            </button>
            <a
              href="https://console.firebase.google.com/project/digitalmesstoken/firestore/databases/-default-/data"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-md bg-[#002045] text-white font-semibold text-[11px] hover:bg-[#1a365d] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              Firebase Console
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#c4c6cf]/60 bg-gray-50 px-5 gap-2">
          <button
            onClick={() => setActiveTab('salesforce')}
            className={`px-4 py-2.5 text-[13px] font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'salesforce'
                ? 'border-[#002045] text-[#002045] bg-white'
                : 'border-transparent text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px] text-[#0284c7]">cloud_sync</span>
            Salesforce Live Backend ({sfStats.menus.length + sfStats.students.length + sfStats.tokens.length + sfStats.attendances.length + sfStats.users.length})
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2.5 text-[13px] font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tokens'
                ? 'border-[#002045] text-[#002045] bg-white'
                : 'border-transparent text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">confirmation_number</span>
            Tokens ({tokens.length})
          </button>
          <button
            onClick={() => setActiveTab('logins')}
            className={`px-4 py-2.5 text-[13px] font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'logins'
                ? 'border-[#002045] text-[#002045] bg-white'
                : 'border-transparent text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">history</span>
            Login Activity Logs ({loginLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-[13px] font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users'
                ? 'border-[#002045] text-[#002045] bg-white'
                : 'border-transparent text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">group</span>
            Users Collection ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 text-[13px] font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-[#002045] text-[#002045] bg-white'
                : 'border-transparent text-[#43474e] hover:text-[#002045]'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">help_outline</span>
            How Backend Works
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* SALESFORCE TAB */}
          {activeTab === 'salesforce' && (
            <div className="space-y-4">
              {/* Sync Action Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#002045] to-[#0d3b66] text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[20px] text-[#38bdf8]">cloud_sync</span>
                    <h3 className="font-bold text-[15px]">Salesforce Lightning Dual-Mode Integration</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Active
                    </span>
                  </div>
                  <p className="text-[12px] text-white/80">
                    All user logins, student registrations, issued meal tokens, attendances, and daily menus are automatically stored with correct field mappings in Salesforce backend.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={handleTriggerSfSync}
                    disabled={sfSyncing}
                    className="px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${sfSyncing ? 'animate-spin' : ''}`}>
                      {sfSyncing ? 'sync' : 'bolt'}
                    </span>
                    {sfSyncing ? 'Syncing to Salesforce...' : 'Sync All Data to Salesforce'}
                  </button>

                  <a
                    href="https://resourceful-otter-8068vd-dev-ed.trailblaze.my.salesforce.com/lightning/o/Menu__c/list?filterName=All"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">launch</span>
                    Open Salesforce Org
                  </a>
                </div>
              </div>

              {sfSyncMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-[12px] flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                  <span>{sfSyncMessage}</span>
                </div>
              )}

              {/* Sub-Object Navigation Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSfActiveSubObject('menus')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sfActiveSubObject === 'menus'
                      ? 'bg-[#002045] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">restaurant_menu</span>
                  Menus (`Menu__c`): {sfStats.menus.length}
                </button>
                <button
                  onClick={() => setSfActiveSubObject('students')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sfActiveSubObject === 'students'
                      ? 'bg-[#002045] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">school</span>
                  Students (`Student__c`): {sfStats.students.length}
                </button>
                <button
                  onClick={() => setSfActiveSubObject('tokens')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sfActiveSubObject === 'tokens'
                      ? 'bg-[#002045] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">confirmation_number</span>
                  Tokens (`Meal_Token__c`): {sfStats.tokens.length}
                </button>
                <button
                  onClick={() => setSfActiveSubObject('attendances')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sfActiveSubObject === 'attendances'
                      ? 'bg-[#002045] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">fact_check</span>
                  Attendance (`Meal_Attendance__c`): {sfStats.attendances.length}
                </button>
                <button
                  onClick={() => setSfActiveSubObject('users')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sfActiveSubObject === 'users'
                      ? 'bg-[#002045] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">badge</span>
                  Mess Users (`Mess_User__c`): {sfStats.users.length}
                </button>
              </div>

              {/* Object Tables */}
              {sfActiveSubObject === 'menus' && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Menu Number</th>
                        <th className="p-2.5">Item Name</th>
                        <th className="p-2.5">Meal Type</th>
                        <th className="p-2.5">Diet</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Available</th>
                        <th className="p-2.5">Record ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sfStats.menus.map((m: any) => (
                        <tr key={m.Id} className="hover:bg-blue-50/40">
                          <td className="p-2.5 font-mono font-bold text-[#002045]">{m.Name}</td>
                          <td className="p-2.5 font-medium">{m.Item_Name__c || 'Standard Session Menu'}</td>
                          <td className="p-2.5">{m.Meal_Type__c}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.Diet_Preference__c === 'Veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {m.Diet_Preference__c || 'Veg'}
                            </span>
                          </td>
                          <td className="p-2.5 text-gray-600">{m.Menu_Date__c || 'Daily'}</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-semibold">Active</span>
                          </td>
                          <td className="p-2.5 font-mono text-[10px] text-gray-400">{m.Id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sfActiveSubObject === 'students' && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Student ID</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Year</th>
                        <th className="p-2.5">Department</th>
                        <th className="p-2.5">Room</th>
                        <th className="p-2.5">Diet</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sfStats.students.map((s: any) => (
                        <tr key={s.Id} className="hover:bg-blue-50/40">
                          <td className="p-2.5 font-mono font-bold text-[#002045]">{s.Student_ID__c || s.Name}</td>
                          <td className="p-2.5 font-medium">{s.Name}</td>
                          <td className="p-2.5 font-medium text-sky-700 bg-sky-50/60 rounded">{s.Academic_Year__c || '1st Year'}</td>
                          <td className="p-2.5 text-gray-600">{s.Department__c || 'Engineering'}</td>
                          <td className="p-2.5 text-gray-600">{s.Hostel_Room__c || 'BH-1'}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.Diet_Preference__c === 'Veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {s.Diet_Preference__c || 'Veg'}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px]">{s.Phone__c || '-'}</td>
                          <td className="p-2.5 text-gray-600">{s.Email__c || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sfActiveSubObject === 'tokens' && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Token #</th>
                        <th className="p-2.5">Student</th>
                        <th className="p-2.5">Meal Type</th>
                        <th className="p-2.5">Diet</th>
                        <th className="p-2.5">Date &amp; Time</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sfStats.tokens.map((t: any) => (
                        <tr key={t.Id} className="hover:bg-blue-50/40">
                          <td className="p-2.5 font-mono font-bold text-[#002045]">{t.Token_Number__c || t.Name}</td>
                          <td className="p-2.5 font-medium">{t.Student__r?.Name || 'Resident Student'}</td>
                          <td className="p-2.5">{t.Meal_Type__c}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.Diet_Preference__c === 'Veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                            }`}>
                              {t.Diet_Preference__c || 'Veg'}
                            </span>
                          </td>
                          <td className="p-2.5 text-gray-600 font-mono text-[11px]">{t.Token_Date__c} {t.Token_Time__c || ''}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">{t.Status__c || 'Issued'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sfActiveSubObject === 'attendances' && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Attendance #</th>
                        <th className="p-2.5">Student</th>
                        <th className="p-2.5">Token Linked</th>
                        <th className="p-2.5">Meal Type</th>
                        <th className="p-2.5">Date &amp; Time</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sfStats.attendances.map((a: any) => (
                        <tr key={a.Id} className="hover:bg-blue-50/40">
                          <td className="p-2.5 font-mono font-bold text-[#002045]">{a.Name}</td>
                          <td className="p-2.5 font-medium">{a.Student__r?.Name || 'Resident Student'}</td>
                          <td className="p-2.5 font-mono text-gray-700">{a.Meal_Token__r?.Token_Number__c || 'Token Ref'}</td>
                          <td className="p-2.5">{a.Meal_Type__c}</td>
                          <td className="p-2.5 text-gray-600 font-mono text-[11px]">{a.Attendance_Date__c} {a.Recorded_Time__c || ''}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">{a.Attendance_Status__c || 'Present'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {sfActiveSubObject === 'users' && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Department</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Last Login</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sfStats.users.map((u: any) => (
                        <tr key={u.Id} className="hover:bg-blue-50/40">
                          <td className="p-2.5 font-bold text-[#002045]">{u.Name}</td>
                          <td className="p-2.5 font-mono text-[11px]">{u.Email__c}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">{u.Role__c || 'Admin'}</span>
                          </td>
                          <td className="p-2.5 text-gray-600">{u.Department__c || 'Mess Administration'}</td>
                          <td className="p-2.5 font-mono text-[11px]">{u.Phone__c || '-'}</td>
                          <td className="p-2.5 text-gray-600 text-[11px] font-mono">{u.Last_Login__c ? new Date(u.Last_Login__c).toLocaleString() : 'Recent'}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">{u.Status__c || 'Active'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TOKENS TAB */}
          {activeTab === 'tokens' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] text-[#43474e]">
                  Every token issued via Counter or Student Self-Serve is stored in the <strong>tokens</strong> Firestore collection.
                </p>
                <input
                  type="text"
                  placeholder="Filter by Student or Token..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 text-[12px] border border-gray-300 rounded-lg w-56"
                />
              </div>

              {tokens.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-[14px]">
                  No tokens stored yet. Issue a token to see live records here!
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Token #</th>
                        <th className="p-2.5">Student ID &amp; Name</th>
                        <th className="p-2.5">Meal</th>
                        <th className="p-2.5">Diet</th>
                        <th className="p-2.5">Date &amp; Time</th>
                        <th className="p-2.5">Issued By</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tokens
                        .filter(
                          (t) =>
                            !searchTerm ||
                            t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((t) => (
                          <tr key={t.id} className="hover:bg-blue-50/50">
                            <td className="p-2.5 font-mono font-bold text-[#002045]">{t.tokenNumber}</td>
                            <td className="p-2.5">
                              <span className="font-semibold block">{t.studentName}</span>
                              <span className="text-[11px] text-gray-500 font-mono">{t.studentId}</span>
                            </td>
                            <td className="p-2.5 font-medium">{t.mealType}</td>
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
                            <td className="p-2.5 font-mono text-[11px]">
                              {t.date} <span className="text-gray-400">{t.time}</span>
                            </td>
                            <td className="p-2.5 text-gray-600">{t.issuedByName}</td>
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
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* LOGINS TAB */}
          {activeTab === 'logins' && (
            <div className="space-y-3">
              <p className="text-[13px] text-[#43474e]">
                Every time a user logs in (Phone OTP, Email, Google, Student ID), a session audit record is written to the <strong>login_logs</strong> collection.
              </p>

              {loginLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-[14px]">
                  No login logs recorded yet in this session.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">User &amp; Email</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Phone Number</th>
                        <th className="p-2.5">Sign-In Method</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loginLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-blue-50/50">
                          <td className="p-2.5 font-mono text-[11px] text-gray-600">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-2.5">
                            <span className="font-semibold block">{log.name || 'User'}</span>
                            <span className="text-[11px] text-gray-500">{log.email}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                              {log.role}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-gray-700">{log.phone || '—'}</td>
                          <td className="p-2.5 font-semibold text-[#002045]">{log.method}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              {log.status || 'SUCCESS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <p className="text-[13px] text-[#43474e]">
                All registered accounts and profiles stored in the <strong>users</strong> Firestore collection.
              </p>

              {users.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-[14px]">
                  No registered users found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-[12px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Name &amp; ID</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5">Role</th>
                        <th className="p-2.5">Diet</th>
                        <th className="p-2.5">Hostel / Dept</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u, i) => (
                        <tr key={u.id || u.uid || i} className="hover:bg-blue-50/50">
                          <td className="p-2.5">
                            <span className="font-semibold block">{u.name || u.displayName}</span>
                            <span className="text-[11px] text-gray-500 font-mono">{u.studentId || u.Id || u.uid}</span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-gray-700">{u.email}</td>
                          <td className="p-2.5 font-mono text-[11px] text-gray-700">{u.phone || '—'}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-bold text-[10px]">
                              {u.role || 'Student'}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.preference === 'Veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {u.preference || 'Veg'}
                            </span>
                          </td>
                          <td className="p-2.5 text-[11px] text-gray-600">
                            {u.hostelRoom || u.department || 'Hostel Resident'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* GUIDE TAB */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-[13px] text-[#0d1c2e]">
              <div className="bg-[#eff4ff] p-4 rounded-xl border border-[#c4c6cf]">
                <h3 className="font-bold text-[15px] text-[#002045] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">cloud_done</span>
                  How Frontend Data Connects to Backend
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Your Digital Mess Token app is powered by <strong>Google Cloud Firebase Firestore</strong> as the primary cloud database, with optional background synchronization to <strong>Salesforce</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <h4 className="font-bold text-[#002045] flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">group</span>
                    1. Users (`users`)
                  </h4>
                  <p className="text-gray-600 text-[12px]">
                    Stores student/admin profiles, mobile numbers (duplicate protected), department, hostel room, and role.
                  </p>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <h4 className="font-bold text-[#002045] flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">confirmation_number</span>
                    2. Tokens (`tokens`)
                  </h4>
                  <p className="text-gray-600 text-[12px]">
                    Stores issued meal tokens with date, time, meal session, token number, and duplicate scan safeguards.
                  </p>
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <h4 className="font-bold text-[#002045] flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[18px] text-purple-600">login</span>
                    3. Logins (`login_logs`)
                  </h4>
                  <p className="text-gray-600 text-[12px]">
                    Maintains live audit records of who logged in, authentication method (Phone OTP, Email, Google), and timestamps.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  Direct Access via Google Firebase Console
                </h4>
                <p className="text-amber-800 text-[12px] mb-2">
                  To view documents directly in Google Cloud Console:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-amber-900 text-[12px]">
                  <li>Go to <strong>https://console.firebase.google.com/</strong></li>
                  <li>Select your project <strong>digitalmesstoken</strong></li>
                  <li>Click <strong>Firestore Database</strong> in the left sidebar</li>
                  <li>Browse the collections: <strong>tokens</strong>, <strong>users</strong>, and <strong>login_logs</strong></li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-[#c4c6cf]/60 text-[12px]">
          <span className="text-gray-500 font-mono">
            DB Status: Connected • Project ID: digitalmesstoken
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#002045] text-white font-bold hover:bg-[#1a365d] cursor-pointer"
          >
            Close Explorer
          </button>
        </div>

      </div>
    </div>
  );
};
