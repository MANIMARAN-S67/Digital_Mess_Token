import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { MealType, DietPreference, Student, TokenIssuanceLog } from '../types';
import { getSalesforceToken } from './salesforceAuth';
import sfApi from './salesforceApi';
import { salesforceSyncService } from './salesforceSyncService';

export interface TokenRecord {
  id: string;
  tokenNumber: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  mealType: MealType;
  dietPreference: DietPreference;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: 'Issued' | 'Consumed' | 'Cancelled';
  issuedByName: string;
  issuedByEmail?: string;
  issuedByPhone?: string;
  issuedByUserId?: string;
  issuedByRole?: string;
  source: 'Counter' | 'Student_Self_Serve';
  createdAt?: any;
}

const STORAGE_KEY = 'mess_tokens_cloud_cache';

// Helper to get local fallback tokens
function getLocalCachedTokens(): TokenRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCachedTokens(tokens: TokenRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
}

/**
 * Check if a student has already been issued a token for a specific meal session today.
 */
export async function checkTokenIssuedToday(
  studentId: string,
  mealType: MealType,
  dateStr: string
): Promise<TokenRecord | null> {
  // Check local cache first for instant response
  const localList = getLocalCachedTokens();
  const localMatch = localList.find(
    (t) => t.studentId === studentId && t.mealType === mealType && t.date === dateStr && t.status !== 'Cancelled'
  );
  if (localMatch) return localMatch;

  // Query Firestore
  try {
    const q = query(
      collection(db, 'tokens'),
      where('studentId', '==', studentId),
      where('date', '==', dateStr),
      where('mealType', '==', mealType)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const records = snap.docs.map((d) => d.data() as TokenRecord);
      const activeRecord = records.find((r) => r.status !== 'Cancelled');
      if (activeRecord) {
        // Cache it locally
        saveLocalCachedTokens([activeRecord, ...localList.filter((x) => x.id !== activeRecord.id)]);
        return activeRecord;
      }
    }
  } catch (err) {
    console.warn('Firestore token check notice:', err);
  }

  return null;
}

/**
 * Issues a meal token:
 * 1. Validates duplicate prevention.
 * 2. Writes to Firebase Firestore (`tokens` collection).
 * 3. Saves to local cache.
 * 4. Syncs to Salesforce with the issuing Mess Manager's details and updates stats.
 */
export async function issueMealToken(params: {
  student: Student;
  mealType: MealType;
  issuedByName: string;
  issuedByEmail?: string;
  issuedByPhone?: string;
  issuedByUserId?: string;
  issuedByRole?: string;
  source?: 'Counter' | 'Student_Self_Serve';
}): Promise<{ success: boolean; token: TokenRecord; message: string }> {
  const { student, mealType, issuedByName, issuedByEmail, issuedByPhone, issuedByUserId, issuedByRole, source = 'Counter' } = params;
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Duplicate check
  const existing = await checkTokenIssuedToday(student.id, mealType, dateStr);
  if (existing) {
    return {
      success: false,
      token: existing,
      message: `Token already issued today for ${mealType} at ${existing.time} (Token #${existing.tokenNumber})`
    };
  }

  // 2. Generate unique Token ID & human-friendly token number
  const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
  const tokenNumber = `${mealType.slice(0, 2).toUpperCase()}-${uniqueSuffix}`;
  const tokenId = `tkn_${Date.now()}_${uniqueSuffix}`;

  const tokenRecord: TokenRecord = {
    id: tokenId,
    tokenNumber,
    studentId: student.id,
    studentName: student.name,
    studentEmail: student.email || '',
    studentPhone: student.phone || '',
    mealType,
    dietPreference: student.preference,
    date: dateStr,
    time: timeStr,
    status: 'Issued',
    issuedByName: issuedByName || 'Mess Manager',
    issuedByEmail: issuedByEmail || '',
    issuedByPhone: issuedByPhone || '',
    issuedByUserId: issuedByUserId || '',
    issuedByRole: issuedByRole || 'Mess Manager',
    source
  };

  // 3. Save to Firebase Firestore (`tokens` collection)
  try {
    const tokenDocRef = doc(db, 'tokens', tokenId);
    await setDoc(tokenDocRef, {
      ...tokenRecord,
      createdAt: serverTimestamp()
    });
    console.log('Token successfully stored in Firestore backend:', tokenId);
  } catch (err) {
    console.warn('Firestore token write notice (persisting locally):', err);
  }

  // 4. Update local cache
  const cached = getLocalCachedTokens();
  saveLocalCachedTokens([tokenRecord, ...cached.filter((t) => t.id !== tokenId)]);

  // 5. Background sync with Salesforce (links manager sfUserId and updates issuer stats)
  salesforceSyncService.syncMealToken(tokenRecord, student, issuedByUserId).catch((err) => {
    console.warn('[Salesforce Sync] Token auto-sync note:', err);
  });

  return {
    success: true,
    token: tokenRecord,
    message: `Token #${tokenNumber} issued successfully for ${student.name}`
  };
}

/**
 * Fetch all tokens for today or all stored tokens.
 */
export async function getAllTokens(limitCount: number = 200): Promise<TokenRecord[]> {
  const localList = getLocalCachedTokens();

  try {
    const q = query(collection(db, 'tokens'), limit(limitCount));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const firestoreTokens = snap.docs.map((d) => d.data() as TokenRecord);
      
      // Merge unique by id
      const mergedMap = new Map<string, TokenRecord>();
      localList.forEach((t) => mergedMap.set(t.id, t));
      firestoreTokens.forEach((t) => mergedMap.set(t.id, t));

      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time)
      );
      saveLocalCachedTokens(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Firestore fetch tokens notice:', err);
  }

  return localList.sort((a, b) => (b.date + ' ' + b.time).localeCompare(a.date + ' ' + a.time));
}

/**
 * Fetch tokens for a specific student.
 */
export async function getStudentTokens(studentId: string): Promise<TokenRecord[]> {
  const allTokens = await getAllTokens(500);
  return allTokens.filter((t) => t.studentId === studentId);
}

/**
 * Resets a student's meal session today.
 */
export async function resetStudentSession(studentId: string, mealType: MealType, dateStr?: string): Promise<boolean> {
  const today = dateStr || new Date().toISOString().split('T')[0];

  // 1. Update local cache
  const cached = getLocalCachedTokens();
  const updatedCache = cached.map((t) => {
    if (t.studentId === studentId && t.mealType === mealType && t.date === today) {
      return { ...t, status: 'Cancelled' as const };
    }
    return t;
  });
  saveLocalCachedTokens(updatedCache);

  // 2. Update Firestore
  try {
    const q = query(
      collection(db, 'tokens'),
      where('studentId', '==', studentId),
      where('date', '==', today),
      where('mealType', '==', mealType)
    );
    const snap = await getDocs(q);
    const updatePromises = snap.docs.map((d) =>
      setDoc(doc(db, 'tokens', d.id), { status: 'Cancelled' }, { merge: true })
    );
    await Promise.all(updatePromises);
    return true;
  } catch (err) {
    console.warn('Firestore reset notice:', err);
  }

  return true;
}

/**
 * Converts TokenRecord to TokenIssuanceLog for existing components
 */
export function tokenRecordToLog(t: TokenRecord): TokenIssuanceLog {
  return {
    id: t.id,
    tokenNumber: t.tokenNumber,
    time: t.time,
    date: t.date,
    studentId: t.studentId,
    studentName: t.studentName,
    mealType: t.mealType,
    dietPreference: t.dietPreference,
    status: t.status === 'Cancelled' ? 'Declined' : 'Issued',
    declineReason: t.status === 'Cancelled' ? 'Session reset by admin' : undefined,
    issuedByName: t.issuedByName,
    issuedByEmail: t.issuedByEmail,
    issuedByPhone: t.issuedByPhone,
    issuedByUserId: t.issuedByUserId,
    issuedByRole: t.issuedByRole
  };
}

/**
 * Calculates student eating metrics (Today, This Week, This Month)
 */
export function calculateStudentEatStats(tokens: TokenRecord[], studentId: string) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Start of this week (Monday)
  const dayOfWeek = now.getDay() || 7; // Monday = 1, Sunday = 7
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];

  // Start of this month (1st of month)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

  const studentTokens = tokens.filter((t) => t.studentId === studentId && t.status !== 'Cancelled');

  const todayTokens = studentTokens.filter((t) => t.date === todayStr);
  const weekTokens = studentTokens.filter((t) => t.date >= startOfWeekStr);
  const monthTokens = studentTokens.filter((t) => t.date >= startOfMonthStr);

  const mealCounts: Record<MealType, number> = {
    Breakfast: 0,
    Lunch: 0,
    Snacks: 0,
    Dinner: 0
  };

  studentTokens.forEach((t) => {
    if (mealCounts[t.mealType] !== undefined) {
      mealCounts[t.mealType]++;
    }
  });

  const vegCount = studentTokens.filter((t) => t.dietPreference === 'Veg').length;
  const nonVegCount = studentTokens.filter((t) => t.dietPreference === 'Non-Veg').length;

  return {
    todayCount: todayTokens.length,
    weekCount: weekTokens.length,
    monthCount: monthTokens.length,
    totalCount: studentTokens.length,
    todayTokens,
    weekTokens,
    monthTokens,
    mealCounts,
    vegCount,
    nonVegCount
  };
}
