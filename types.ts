
export enum VisitStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  RESCHEDULE_REQUESTED = 'RESCHEDULE_REQUESTED',
  CANCELLED = 'CANCELLED'
}

export type Language = 'ar' | 'en' | 'fr' | 'de' | 'ja' | 'hi' | 'ko' | 'zh' | 'tr' | 'fil' | 'pt';

export type SoundType = 'default' | 'chime' | 'bell' | 'futuristic';

export interface PrivacySettings {
  allowPublicInvites: boolean;
  shareLocationWithGuests: boolean;
  showOnlineStatus: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  categories: {
    visits: boolean;
    system: boolean;
  };
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  city: string;
  avatarUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
  isAdmin?: boolean;
  calComUsername?: string;
  privacySettings?: PrivacySettings;
  // Allow string to support Base64 data URI for custom sounds
  soundPreference?: SoundType | string; 
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string; // Changed from strict union to string to allow custom relations
  calComUsername?: string;
  // Allow string to support Base64 data URI for custom sounds
  customRingtone?: SoundType | string;
}

export interface Visit {
  id: string;
  hostId: string;
  hostName: string;
  visitorId: string;
  visitorName: string;
  date: string; // ISO Date string
  time: string;
  guests: number;
  status: VisitStatus;
  notes: string;
  locationName: string;
  locationCoords?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'error';
  timestamp: number;
  read: boolean;
}