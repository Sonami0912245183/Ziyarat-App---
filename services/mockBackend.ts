import { User, Visit, Contact, VisitStatus } from '../types';

// Helper for dynamic dates to ensure features like reminders always have test data
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// Format as YYYY-MM-DD in local time to avoid UTC mismatch issues
const year = tomorrow.getFullYear();
const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
const day = String(tomorrow.getDate()).padStart(2, '0');
const tomorrowStr = `${year}-${month}-${day}`;

// Mock Data
const MOCK_USER: User = {
  id: 'u1',
  fullName: 'أحمد العتيبي',
  phone: '966500000000',
  city: 'الرياض',
  avatarUrl: 'https://picsum.photos/200',
  isAdmin: true,
  location: { lat: 24.7136, lng: 46.6753 },
  calComUsername: ''
};

const INITIAL_VISITS: Visit[] = [
  {
    id: 'v1',
    hostId: 'u2',
    hostName: 'محمد السالم',
    visitorId: 'u1',
    visitorName: 'أحمد العتيبي',
    date: '2023-12-01',
    time: '20:00',
    guests: 3,
    status: VisitStatus.PENDING,
    notes: 'قهوة مغربية',
    locationName: 'منزل محمد - حي الملقا',
    locationCoords: { lat: 24.8105, lng: 46.6190 },
    createdAt: new Date().toISOString()
  },
  {
    id: 'v2',
    hostId: 'u1',
    hostName: 'أحمد العتيبي',
    visitorId: 'u3',
    visitorName: 'خالد الفهد',
    date: '2023-12-05',
    time: '19:30',
    guests: 1,
    status: VisitStatus.ACCEPTED,
    notes: 'زيارة سريعة',
    locationName: 'منزلي',
    locationCoords: { lat: 24.7136, lng: 46.6753 },
    createdAt: new Date().toISOString()
  },
  {
    id: 'v3-reminder',
    hostId: 'u2',
    hostName: 'محمد السالم',
    visitorId: 'u1',
    visitorName: 'أحمد العتيبي',
    date: tomorrowStr, // Always set to tomorrow for testing reminders
    time: '20:30',
    guests: 2,
    status: VisitStatus.ACCEPTED,
    notes: 'عشاء عمل - تذكير تلقائي',
    locationName: 'مطعم نجد فيلج',
    locationCoords: { lat: 24.7444, lng: 46.6753 },
    createdAt: new Date().toISOString()
  }
];

const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', name: 'الوالد', phone: '966501111111', relation: 'Family' },
  { id: 'c2', name: 'محمد السالم', phone: '966502222222', relation: 'Friend', calComUsername: 'mohammed' },
  { id: 'c3', name: 'أبو عبدالله', phone: '966503333333', relation: 'Friend' },
];

// Simulation Logic
let visits = [...INITIAL_VISITS];

export const mockLogin = async (phone: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ...MOCK_USER, phone });
    }, 1000);
  });
};

export const mockVerifyOtp = async (otp: string): Promise<boolean> => {
    return new Promise(resolve => setTimeout(() => resolve(otp === '1234'), 800));
};

export const getVisits = async (): Promise<Visit[]> => {
  return Promise.resolve([...visits]);
};

export const createVisit = async (visit: Omit<Visit, 'id' | 'createdAt' | 'status'>): Promise<Visit> => {
  const newVisit: Visit = {
    ...visit,
    id: Math.random().toString(36).substr(2, 9),
    status: VisitStatus.PENDING,
    createdAt: new Date().toISOString()
  };
  visits.unshift(newVisit); // Add to top
  return Promise.resolve(newVisit);
};

export const updateVisitStatus = async (id: string, status: VisitStatus, newDate?: string, newTime?: string): Promise<void> => {
  visits = visits.map(v => {
    if (v.id === id) {
        return { ...v, status, date: newDate || v.date, time: newTime || v.time };
    }
    return v;
  });
  return Promise.resolve();
};

export const getContacts = async (): Promise<Contact[]> => {
  return Promise.resolve(INITIAL_CONTACTS);
};