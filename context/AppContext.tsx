
import React, { createContext, useContext, useState, useEffect, PropsWithChildren, useRef } from 'react';
import { User, Visit, Contact, VisitStatus, Notification, Language, SoundType } from '../types';
import * as api from '../services/mockBackend';
import { requestNotificationPermission, onMessageListener } from '../services/firebaseService';
import { translations } from '../services/translations';

interface AppContextType {
  user: User | null;
  visits: Visit[];
  contacts: Contact[];
  isLoading: boolean;
  activeNotification: Notification | null;
  notificationsList: Notification[];
  language: Language;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  login: (phone: string, countryCode: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  addVisit: (visit: Omit<Visit, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  changeVisitStatus: (id: string, status: VisitStatus, date?: string, time?: string, notes?: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  addNewContact: (contact: Omit<Contact, 'id'>) => Promise<void>;
  dismissActiveNotification: () => void;
  markNotificationsAsRead: () => void;
  showNotification: (title: string, body: string, type?: 'info' | 'success' | 'error', senderId?: string) => void;
  exportVisitsToCSV: () => void;
  playSound: (typeOrBase64: SoundType | string) => void;
  shareApp: () => void;
  simulateIncomingVisit: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Base64 Audio Strings
const SOUNDS: Record<SoundType, string> = {
  default: 'data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAPAAADTGl2b2ZmTGF2LmNvbT//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAADAAAAAAAABAAAAAAAAAAAAAA//uQZAAABHpOwdAAAASwAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA', // Short Pop
  chime: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAADAAAAAAAABAAAAAAAAAAAAAA//uQZAAABHpOwdAAAASwAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA', // Placeholder 
  bell: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAADAAAAAAAABAAAAAAAAAAAAAA//uQZAAABHpOwdAAAASwAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAAA', // Placeholder
  futuristic: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAADAAAAAAAABAAAAAAAAAAAAAA//uQZAAABHpOwdAAAASwAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA' // Placeholder
};

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  
  // Language State (Persisted)
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'ar';
  });

  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const soundTimeoutRef = useRef<number | null>(null);

  // --- Initialization ---
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('ziyarat_user');
      if (storedUser) {
        try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            await loadData();
        } catch (e) {
            localStorage.removeItem('ziyarat_user');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // --- Language & Direction Side Effects ---
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('app_lang', language);
  }, [language]);

  // --- Reminder Check (Local Time) ---
  useEffect(() => {
    if (!user || visits.length === 0) return;

    const checkReminders = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowStr = `${year}-${month}-${day}`;
        
        const hasReminder = sessionStorage.getItem('reminder_shown_date');

        if (hasReminder !== tomorrowStr) {
            const upcomingVisit = visits.find(v => 
                v.status === VisitStatus.ACCEPTED && 
                v.date === tomorrowStr &&
                (v.hostId === user.id || v.visitorId === user.id)
            );

            if (upcomingVisit) {
                const partnerName = upcomingVisit.hostId === user.id ? upcomingVisit.visitorName : upcomingVisit.hostName;
                showNotification(t('reminder_title'), `${t('reminder_body')} ${partnerName} ${t('at_time')} ${upcomingVisit.time}`);
                sessionStorage.setItem('reminder_shown_date', tomorrowStr);
            }
        }
    };
    
    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [visits, user, language]);

  // --- Helpers ---
  const loadData = async () => {
    const [v, c] = await Promise.all([api.getVisits(), api.getContacts()]);
    setVisits(v);
    setContacts(c);
  };

  const setLanguage = (lang: Language) => {
      setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    const dict = translations[language] || translations['en'];
    return dict[key] || key;
  };

  const playSound = (typeOrBase64: SoundType | string) => {
      try {
          if (soundTimeoutRef.current) {
              clearTimeout(soundTimeoutRef.current);
              audioRef.current.pause();
          }

          let src = '';
          if (typeOrBase64.startsWith('data:audio')) {
              src = typeOrBase64; // It's raw base64 data
          } else {
              src = SOUNDS[typeOrBase64 as SoundType] || SOUNDS['default'];
          }
          
          audioRef.current.src = src;
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log("Audio play blocked", e));

          // Enforce 5s limit
          soundTimeoutRef.current = window.setTimeout(() => {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
          }, 5000);

      } catch (e) {
          console.error("Sound error", e);
      }
  };

  const showNotification = (title: string, body: string, type: 'info' | 'success' | 'error' = 'info', senderId?: string) => {
    const newNotif: Notification = {
        id: Date.now().toString(),
        title,
        body,
        type,
        timestamp: Date.now(),
        read: false
    };
    setActiveNotification(newNotif);
    setNotificationsList(prev => [newNotif, ...prev]);

    // Determine Sound to Play
    let soundToPlay: string = user?.soundPreference || 'default';
    
    // Check if notification is from a contact with a custom ringtone
    if (senderId) {
        const contactId = senderId.replace('u_temp_', ''); 
        const contact = contacts.find(c => c.id === contactId || c.phone === senderId);
        if (contact && contact.customRingtone) {
            soundToPlay = contact.customRingtone;
        }
    }
    
    // Check if sound preference is actually a custom base64 string or a preset
    // If it's a known key, good. If it's base64, playSound handles it.
    playSound(soundToPlay);
    
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' });
    }
  };

  const dismissActiveNotification = () => {
    setActiveNotification(null);
  };

  const markNotificationsAsRead = () => {
      setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const shareApp = () => {
      const url = translations[language]['share_text'];
      const justUrl = url.match(/https?:\/\/[^\s]+/)?.[0] || url;
      navigator.clipboard.writeText(justUrl).then(() => {
          showNotification(t('share_app'), t('link_copied'), 'success');
      });
  };

  const simulateIncomingVisit = () => {
      setTimeout(() => {
          // Simulate a random contact visiting
          const randomContact = contacts[0];
          if (randomContact) {
            showNotification(t('new_notification'), `${randomContact.name} ${t('nav_home') === 'الرئيسية' ? 'يريد زيارتك' : 'wants to visit you'}`, 'info', randomContact.id);
          } else {
            showNotification(t('new_notification'), `${t('nav_home') === 'الرئيسية' ? 'شخص ما' : 'Someone'} ${t('nav_home') === 'الرئيسية' ? 'يريد زيارتك' : 'wants to visit you'}`, 'info');
          }
      }, 3000);
  };

  // --- Actions ---

  const login = async (phone: string, countryCode: string) => {
    const fullPhone = `${countryCode}${phone}`;
    const user = await api.mockLogin(fullPhone);
    setUser(user);
    localStorage.setItem('ziyarat_user', JSON.stringify(user));
    await loadData();
  };

  const verifyOtp = async (otp: string) => {
    return await api.mockVerifyOtp(otp);
  };

  const logout = () => {
    setUser(null);
    setVisits([]);
    setContacts([]);
    localStorage.removeItem('ziyarat_user');
  };

  const refreshData = async () => {
    await loadData();
  };

  const addVisit = async (visitData: Omit<Visit, 'id' | 'createdAt' | 'status'>) => {
    const newVisit = await api.createVisit(visitData);
    setVisits(prev => [newVisit, ...prev]);
    showNotification(t('sent_success'), t('visit_sent_success'), 'success');
    simulateIncomingVisit(); // Demo feature
  };

  const changeVisitStatus = async (id: string, status: VisitStatus, newDate?: string, newTime?: string, notes?: string) => {
    await api.updateVisitStatus(id, status, newDate, newTime);
    setVisits(prev => prev.map(v => {
        if (v.id === id) {
            return { ...v, status, date: newDate || v.date, time: newTime || v.time, notes: notes || v.notes };
        }
        return v;
    }));

    let msg = t('status_updated');
    if (status === VisitStatus.ACCEPTED) msg = t('visit_accepted');
    if (status === VisitStatus.REJECTED) msg = t('visit_rejected');
    if (status === VisitStatus.RESCHEDULE_REQUESTED) msg = t('reschedule_requested');

    showNotification(t('status_update_title'), msg, 'info');
  };

  const updateUserProfile = async (data: Partial<User>) => {
      if (!user) return;
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('ziyarat_user', JSON.stringify(updatedUser));
      showNotification(t('profile'), t('changes_saved'), 'success');
  };

  const addNewContact = async (contactData: Omit<Contact, 'id'>) => {
      const newContact: Contact = { ...contactData, id: `c_${Date.now()}` };
      setContacts(prev => [...prev, newContact]);
      showNotification(t('contacts'), `${t('contact_added')} ${contactData.name}`, 'success');
  };

  const updateContact = async (id: string, data: Partial<Contact>) => {
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
      showNotification(t('contacts'), t('changes_saved'), 'success');
  };

  const exportVisitsToCSV = () => {
      const headers = ['Host', 'Visitor', 'Date', 'Time', 'Status', 'Notes'];
      const rows = visits.map(v => [
          v.hostName, 
          v.visitorName, 
          v.date, 
          v.time, 
          v.status, 
          `"${v.notes}"`
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "ziyarat_visits.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <AppContext.Provider value={{
      user, visits, contacts, isLoading, 
      activeNotification, notificationsList, language, t,
      setLanguage, toggleLanguage, login, verifyOtp, logout, refreshData, 
      addVisit, changeVisitStatus, updateUserProfile, addNewContact, updateContact,
      dismissActiveNotification, markNotificationsAsRead, showNotification, exportVisitsToCSV,
      playSound, shareApp, simulateIncomingVisit
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
