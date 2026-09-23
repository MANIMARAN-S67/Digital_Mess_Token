export type MealType = 'Breakfast' | 'Lunch' | 'Snacks' | 'Dinner';
export type DietPreference = 'Veg' | 'Non-Veg';
export type TokenStatus = 'Issued' | 'Declined' | 'Already Issued' | 'Cancelled';

export interface Student {
  id: string; // e.g. "21CS1004"
  name: string; // e.g. "Rahul Sharma"
  department: string; // e.g. "Computer Science"
  hostelRoom: string; // e.g. "BH-3 / 214"
  preference: DietPreference; // "Non-Veg" | "Veg"
  status: 'Active Plan' | 'Fee Dues Pending' | 'Plan Expired';
  photoUrl: string;
  phone?: string;
  email?: string;
  issuedSessionsToday: {
    [key in MealType]?: {
      tokenNumber: string;
      issuedAt: string; // e.g. "12:45 PM"
      timestamp: number;
    };
  };
}

export interface MealSessionInfo {
  type: MealType;
  startTime: string; // "12:30"
  endTime: string; // "14:30"
  displayTime: string; // "12:30 PM - 02:30 PM"
  isActive: boolean;
  timeLeft: string; // "Ends in 45 mins"
}

export interface MealMenuData {
  mainItem: string;
  side1: string;
  beverage: string;
  extras: string[];
}

export type DailyMenu = {
  [meal in MealType]: {
    veg: MealMenuData;
    nonVeg: MealMenuData;
  };
};

export interface TokenIssuanceLog {
  id: string;
  tokenNumber: string; // e.g. "LN-843"
  time: string; // "14:28:15"
  date: string; // "2026-09-22"
  studentId: string;
  studentName: string;
  mealType: MealType;
  dietPreference: DietPreference;
  status: 'Issued' | 'Declined';
  declineReason?: string;
}

export interface DailyStats {
  totalTokensIssued: number;
  totalEligible: number;
  attendanceRate: number; // e.g. 78%
  vegCount: number;
  vegTarget: number;
  nonVegCount: number;
  nonVegTarget: number;
  flowHourly: {
    time: string;
    count: number;
    heightPercent: number;
  }[];
}
