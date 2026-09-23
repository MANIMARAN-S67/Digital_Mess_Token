import { Student, DailyMenu, TokenIssuanceLog, DailyStats } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: '21CS1004',
    name: 'Rahul Sharma',
    department: 'Computer Science',
    hostelRoom: 'BH-3 / 214',
    preference: 'Non-Veg',
    status: 'Active Plan',
    photoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvQPRUyKF9tnZMmQVg704bHnkcZK9r2LYQeP2rHwihHLYDJPr0RoQjT9iyDcO0P9__YLAWa3Lt2zdU5AT1u2wuCVZ-Esqtvr-4LmJVhH27EReQsVnjHloAT4ClWh-_c9GGODv8Dt3LEYqfGr6S3fmaaPKYv31qf7YDo28hfrODAspdUiYMIhdnkTuZn0LLjcsMcZndojlbpFnstSA5ALHMBYJz1gOvKP6u0xudmVtxs3_DlIdVS6pu',
    phone: '+91 98765 43210',
    email: 'rahul.21cs@institution.edu',
    issuedSessionsToday: {}
  },
  {
    id: 'STU-9104',
    name: 'Priya Sharma',
    department: 'Electronics & Comm.',
    hostelRoom: 'GH-2 / 108',
    preference: 'Non-Veg',
    status: 'Active Plan',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face',
    phone: '+91 98123 45678',
    email: 'priya.sharma@institution.edu',
    issuedSessionsToday: {
      Lunch: {
        tokenNumber: 'LN-840',
        issuedAt: '14:27:50',
        timestamp: Date.now() - 1000 * 60 * 4
      }
    }
  },
  {
    id: 'STU-8892',
    name: 'Aarav Patel',
    department: 'Mechanical Engg.',
    hostelRoom: 'BH-1 / 302',
    preference: 'Veg',
    status: 'Active Plan',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    phone: '+91 97890 12345',
    email: 'aarav.patel@institution.edu',
    issuedSessionsToday: {
      Lunch: {
        tokenNumber: 'LN-841',
        issuedAt: '12:45 PM',
        timestamp: Date.now() - 1000 * 60 * 85
      }
    }
  },
  {
    id: 'STU-7731',
    name: 'Rohan Gupta',
    department: 'Civil Engineering',
    hostelRoom: 'BH-2 / 115',
    preference: 'Veg',
    status: 'Active Plan',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
    phone: '+91 98456 78901',
    email: 'rohan.gupta@institution.edu',
    issuedSessionsToday: {
      Lunch: {
        tokenNumber: 'LN-839',
        issuedAt: '14:26:33',
        timestamp: Date.now() - 1000 * 60 * 5
      }
    }
  },
  {
    id: 'STU-8822',
    name: 'Ananya Singh',
    department: 'Information Technology',
    hostelRoom: 'GH-1 / 205',
    preference: 'Veg',
    status: 'Fee Dues Pending',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
    phone: '+91 97654 32109',
    email: 'ananya.singh@institution.edu',
    issuedSessionsToday: {}
  },
  {
    id: 'CS-2023-041',
    name: 'John Doe',
    department: 'Computer Science',
    hostelRoom: 'BH-3 / 102',
    preference: 'Veg',
    status: 'Active Plan',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&fit=crop&crop=face',
    phone: '+91 99887 76655',
    email: 'john.doe@institution.edu',
    issuedSessionsToday: {
      Lunch: {
        tokenNumber: 'LN-838',
        issuedAt: '14:20:10',
        timestamp: Date.now() - 1000 * 60 * 10
      }
    }
  },
  {
    id: 'ME-2022-105',
    name: 'Alice Smith',
    department: 'Mechanical Engg.',
    hostelRoom: 'GH-3 / 310',
    preference: 'Non-Veg',
    status: 'Active Plan',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face',
    phone: '+91 98712 34560',
    email: 'alice.smith@institution.edu',
    issuedSessionsToday: {
      Lunch: {
        tokenNumber: 'LN-837',
        issuedAt: '14:15:02',
        timestamp: Date.now() - 1000 * 60 * 15
      }
    }
  },
  {
    id: 'EC-2024-012',
    name: 'Rahul Jain',
    department: 'Electronics',
    hostelRoom: 'BH-4 / 401',
    preference: 'Veg',
    status: 'Active Plan',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&crop=face',
    phone: '+91 98223 34455',
    email: 'rahul.jain@institution.edu',
    issuedSessionsToday: {
      Lunch: {
        tokenNumber: 'LN-836',
        issuedAt: '14:05:44',
        timestamp: Date.now() - 1000 * 60 * 25
      }
    }
  }
];

export const INITIAL_MENU: DailyMenu = {
  Breakfast: {
    veg: {
      mainItem: 'Idli Sambhar',
      side1: 'Coconut Chutney',
      beverage: 'Filter Coffee / Tea',
      extras: ['Poha', 'Bread Jam']
    },
    nonVeg: {
      mainItem: 'Boiled Eggs (2)',
      side1: 'Toast & Butter',
      beverage: 'Filter Coffee / Tea',
      extras: ['Bread Jam']
    }
  },
  Lunch: {
    veg: {
      mainItem: 'Paneer Butter Masala',
      side1: 'Dal Tadka, Rice, Roti, Salad',
      beverage: 'Sweet Lassi',
      extras: ['Gulab Jamun', 'Papad']
    },
    nonVeg: {
      mainItem: 'Chicken Curry',
      side1: 'Dal Tadka, Rice, Roti, Salad',
      beverage: 'Sweet Lassi',
      extras: ['Gulab Jamun', 'Papad']
    }
  },
  Snacks: {
    veg: {
      mainItem: 'Samosa & Mint Chutney',
      side1: 'Butter Cookies',
      beverage: 'Masala Chai',
      extras: []
    },
    nonVeg: {
      mainItem: 'Egg Puff',
      side1: 'Butter Cookies',
      beverage: 'Masala Chai',
      extras: []
    }
  },
  Dinner: {
    veg: {
      mainItem: 'Aloo Gobi',
      side1: 'Dal Makhani, Rice, Roti',
      beverage: 'Warm Milk / Mineral Water',
      extras: ['Ice Cream']
    },
    nonVeg: {
      mainItem: 'Egg Curry',
      side1: 'Dal Makhani, Rice, Roti',
      beverage: 'Warm Milk / Mineral Water',
      extras: ['Ice Cream']
    }
  }
};

export const INITIAL_LOGS: TokenIssuanceLog[] = [
  {
    id: 'log-1',
    tokenNumber: 'LN-842',
    time: '14:28:15',
    date: '2026-09-22',
    studentId: 'STU-8892',
    studentName: 'Aarav Patel',
    mealType: 'Lunch',
    dietPreference: 'Veg',
    status: 'Issued'
  },
  {
    id: 'log-2',
    tokenNumber: 'LN-841',
    time: '14:27:50',
    date: '2026-09-22',
    studentId: 'STU-9104',
    studentName: 'Priya Sharma',
    mealType: 'Lunch',
    dietPreference: 'Non-Veg',
    status: 'Issued'
  },
  {
    id: 'log-3',
    tokenNumber: 'LN-840',
    time: '14:26:33',
    date: '2026-09-22',
    studentId: 'STU-7731',
    studentName: 'Rohan Gupta',
    mealType: 'Lunch',
    dietPreference: 'Veg',
    status: 'Issued'
  },
  {
    id: 'log-4',
    tokenNumber: 'LN-DECL-01',
    time: '14:25:10',
    date: '2026-09-22',
    studentId: 'STU-8822',
    studentName: 'Ananya Singh',
    mealType: 'Lunch',
    dietPreference: 'Veg',
    status: 'Declined',
    declineReason: 'Mess subscription fee dues pending for Sep 2026'
  },
  {
    id: 'log-5',
    tokenNumber: 'LN-839',
    time: '14:22:45',
    date: '2026-09-22',
    studentId: 'CS-2023-041',
    studentName: 'John Doe',
    mealType: 'Lunch',
    dietPreference: 'Veg',
    status: 'Issued'
  },
  {
    id: 'log-6',
    tokenNumber: 'LN-838',
    time: '14:19:12',
    date: '2026-09-22',
    studentId: 'ME-2022-105',
    studentName: 'Alice Smith',
    mealType: 'Lunch',
    dietPreference: 'Non-Veg',
    status: 'Issued'
  },
  {
    id: 'log-7',
    tokenNumber: 'LN-837',
    time: '14:11:05',
    date: '2026-09-22',
    studentId: 'EC-2024-012',
    studentName: 'Rahul Jain',
    mealType: 'Lunch',
    dietPreference: 'Veg',
    status: 'Issued'
  }
];

export const INITIAL_STATS: DailyStats = {
  totalTokensIssued: 842,
  totalEligible: 1450,
  attendanceRate: 78,
  vegCount: 512,
  vegTarget: 600,
  nonVegCount: 330,
  nonVegTarget: 450,
  flowHourly: [
    { time: '12:00', count: 45, heightPercent: 20 },
    { time: '12:30', count: 120, heightPercent: 40 },
    { time: '13:00', count: 340, heightPercent: 85 },
    { time: '13:30', count: 410, heightPercent: 100 },
    { time: '14:00', count: 200, heightPercent: 60 },
    { time: '14:30', count: 80, heightPercent: 25 }
  ]
};
