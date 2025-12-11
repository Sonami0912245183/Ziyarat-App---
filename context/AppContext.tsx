import React, { createContext, useContext, useState, useEffect, PropsWithChildren, useRef } from 'react';
import { User, Visit, Contact, VisitStatus, Notification, Language, SoundType, NotificationSettings } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { translations } from '../services/translations';
import { sendVisitRequestSMS } from '../services/twilioService';
import { triggerWebhook } from '../services/webhookService';
import { 
  getVisits as getMockVisits, 
  getContacts as getMockContacts, 
  mockLogin as mockBackendLogin,
  createVisit as mockCreateVisit,
  updateVisitStatus as mockUpdateVisitStatus
} from '../services/mockBackend';

interface AppContextType {
  user: User | null;
  visits: Visit[];
  contacts: Contact[];
  isLoading: boolean;
  activeNotification: Notification | null;
  notificationsList: Notification[];
  language: Language;
  isDemoMode: boolean;
  t: (key: string) => string;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  enableDemoMode: () => void;
  loginWithPhone: (phone: string) => Promise<{error?: string}>;
  verifyOtp: (phone: string, token: string) => Promise<{error?: string}>;
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
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Base64 Audio Strings
const SOUNDS: Record<SoundType, string> = {
  default: 'data:audio/mp3;base64,SUQzBAAAAAABAFRYWFgAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhYAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhYAAAAHAAAA2NvbXBhdGlibGVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAPAAADTGl2b2ZmTGF2LmNvbT//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAADAAAAAAAABAAAAAAAAAAAAAA//uQZAAABHpOwdAAAASwAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA', 
  chime: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAADAAAAAAAABAAAAAAAAAAAAAA//uQZAAABHpOwdAAAASwAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA', 
  bell: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAADAAAAAAAABAAAAAAAAAAAAAA//uQZAAABHpOwdAAAASwAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAAA', 
  futuristic: 'data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAA0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAADAAAAAAAABAAAAAAAAAAAAAA//uQZAAABHpOwdAAAASwAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA//uQZAAAAAAAABAAAAAAAAAAAAAAAABAAAAAAAAAAAAAA' 
};

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('ziyarat_notif_settings');
    return saved ? JSON.parse(saved) : { enabled: true, soundEnabled: true, vibrationEnabled: true, categories: { visits: true, system: true } };
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_lang') as Language) || 'ar';
  });

  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const soundTimeoutRef = useRef<number | null>(null);

  // --- Auth & Init ---
  useEffect(() => {
    const initSession = async () => {
      if (!isSupabaseConfigured()) {
          console.warn("Supabase keys not set. Switching to Demo Mode capable.");
          setIsLoading(false);
          return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
          await fetchUserProfile(session.user.id);
      } else {
          setIsLoading(false);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
             await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
             setUser(null);
             setVisits([]);
             setContacts([]);
             setIsDemoMode(false);
             setIsLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    };
    initSession();
  }, []);

  const fetchUserProfile = async (userId: string) => {
      try {
          const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (data) {
              setUser({
                  id: data.id,
                  fullName: data.full_name || 'User',
                  phone: data.phone,
                  city: data.city || 'الرياض',
                  avatarUrl: data.avatar_url,
                  location: data.location,
                  calComUsername: data.cal_com_username,
                  privacySettings: data.privacy_settings,
                  soundPreference: data.sound_preference,
              });
              await refreshData();
          }
      } catch (e) {
          console.error("Profile Fetch Error", e);
      } finally {
          setIsLoading(false);
      }
  };

  const refreshData = async () => {
      if (isDemoMode) {
          const v = await getMockVisits();
          setVisits(v);
          const c = await getMockContacts();
          setContacts(c);
          return;
      }

      if (!user) return;
      try {
        const { data: visitsData } = await supabase.from('visits').select('*').order('created_at', { ascending: false });
        if (visitsData) {
            setVisits(visitsData.map(v => ({
                id: v.id,
                hostId: v.host_id,
                hostName: v.host_name,
                visitorId: v.visitor_id,
                visitorName: v.visitor_name,
                date: v.date,
                time: v.time,
                guests: v.guests,
                status: v.status,
                notes: v.notes,
                locationName: v.location_name,
                locationCoords: v.location_coords,
                createdAt: v.created_at
            })));
        }

        const { data: contactsData } = await supabase.from('contacts').select('*');
        if (contactsData) {
             setContacts(contactsData.map(c => ({
                 id: c.id,
                 name: c.name,
                 phone: c.phone,
                 relation: c.relation,
                 calComUsername: c.cal_com_username,
                 customRingtone: c.custom_ringtone
             })));
        }
      } catch (e) { console.error(e); }
  };

  // --- Auth Actions (Twilio SMS) ---
  
  const enableDemoMode = () => setIsDemoMode(true);

  const loginWithPhone = async (phone: string) => {
      // This triggers Supabase which triggers Twilio SMS
      const { error } = await supabase.auth.signInWithOtp({
          phone: phone,
      });
      return { error: error?.message };
  };

  const verifyOtp = async (phone: string, token: string) => {
      if (isDemoMode) {
          if (token === '123456') {
             const u = await mockBackendLogin(phone);
             setUser(u);
             await refreshData();
             return { error: undefined };
          }
          return { error: 'رمز غير صحيح (الوضع التجريبي: 123456)' };
      }

      const { data, error } = await supabase.auth.verifyOtp({
          phone: phone,
          token: token,
          type: 'sms'
      });
      return { error: error?.message };
  };

  const logout = async () => {
      if (isDemoMode) {
          setUser(null);
          setVisits([]);
          setContacts([]);
          setIsDemoMode(false);
          return;
      }
      await supabase.auth.signOut();
  };

  // --- Data Actions ---

  const addVisit = async (visitData: Omit<Visit, 'id' | 'createdAt' | 'status'>) => {
      if (isDemoMode) {
          const newVisit = await mockCreateVisit(visitData);
          setVisits(prev => [newVisit, ...prev]);
          showNotification(t('sent_success'), t('visit_sent_success'), 'success');
          return;
      }

      const { data, error } = await supabase.from('visits').insert({
          created_by: user?.id,
          host_id: visitData.hostId,
          host_name: visitData.hostName,
          visitor_id: visitData.visitorId,
          visitor_name: visitData.visitorName,
          date: visitData.date,
          time: visitData.time,
          guests: visitData.guests,
          status: VisitStatus.PENDING,
          notes: visitData.notes,
          location_name: visitData.locationName,
          location_coords: visitData.locationCoords
      }).select().single();

      if (!error && data) {
          const newVisit: Visit = {
             ...visitData,
             id: data.id,
             status: VisitStatus.PENDING,
             createdAt: data.created_at
          };
          setVisits(prev => [newVisit, ...prev]);
          showNotification(t('sent_success'), t('visit_sent_success'), 'success');
          
          triggerWebhook('visit_created', newVisit);

          // --- TWILIO SMS NOTIFICATION ---
          if (visitData.visitorId === user?.id) {
               const hostIdClean = visitData.hostId.replace('u_temp_', '');
               const contact = contacts.find(c => c.id === hostIdClean);
               if (contact) {
                    await sendVisitRequestSMS(contact.phone, user.fullName, visitData.date, visitData.time);
               }
          }
      }
  };

  const changeVisitStatus = async (id: string, status: VisitStatus, date?: string, time?: string, notes?: string) => {
      if (isDemoMode) {
          await mockUpdateVisitStatus(id, status, date, time);
          setVisits(prev => prev.map(v => v.id === id ? { ...v, status, date: date || v.date, time: time || v.time, notes: notes || v.notes } : v));
          let msg = t('status_updated');
          if (status === VisitStatus.ACCEPTED) msg = t('visit_accepted');
          if (status === VisitStatus.REJECTED) msg = t('visit_rejected');
          showNotification(t('status_update_title'), msg, 'info');
          return;
      }

      const updatePayload: any = { status };
      if (date) updatePayload.date = date;
      if (time) updatePayload.time = time;
      if (notes) updatePayload.notes = notes;

      const { error } = await supabase.from('visits').update(updatePayload).eq('id', id);

      if (!error) {
          setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updatePayload } : v));
          let msg = t('status_updated');
          if (status === VisitStatus.ACCEPTED) msg = t('visit_accepted');
          if (status === VisitStatus.REJECTED) msg = t('visit_rejected');
          if (status === VisitStatus.RESCHEDULE_REQUESTED) msg = t('reschedule_requested');
          showNotification(t('status_update_title'), msg, 'info');
      }
  };

  const updateUserProfile = async (data: Partial<User>) => {
      if (!user) return;
      
      if (isDemoMode) {
          setUser(prev => prev ? { ...prev, ...data } : null);
          showNotification(t('profile'), t('changes_saved'), 'success');
          return;
      }

      const dbPayload: any = {};
      if (data.fullName) dbPayload.full_name = data.fullName;
      if (data.city) dbPayload.city = data.city;
      if (data.avatarUrl) dbPayload.avatar_url = data.avatarUrl;
      if (data.location) dbPayload.location = data.location;
      if (data.calComUsername) dbPayload.cal_com_username = data.calComUsername;
      if (data.soundPreference) dbPayload.sound_preference = data.soundPreference;
      if (data.privacySettings) dbPayload.privacy_settings = data.privacySettings;

      const { error } = await supabase.from('profiles').update(dbPayload).eq('id', user.id);
      
      if (!error) {
          setUser(prev => prev ? { ...prev, ...data } : null);
          showNotification(t('profile'), t('changes_saved'), 'success');
      }
  };

  const addNewContact = async (contactData: Omit<Contact, 'id'>) => {
      if (!user) return;

      if (isDemoMode) {
          const newContact: Contact = { 
              id: `c_mock_${Date.now()}`, 
              name: contactData.name, 
              phone: contactData.phone, 
              relation: contactData.relation 
          };
          setContacts(prev => [...prev, newContact]);
          showNotification(t('contacts'), `${t('contact_added')} ${contactData.name}`, 'success');
          return;
      }

      const { data, error } = await supabase.from('contacts').insert({
          user_id: user.id,
          name: contactData.name,
          phone: contactData.phone,
          relation: contactData.relation
      }).select().single();

      if (!error && data) {
          const newContact: Contact = { 
              id: data.id, 
              name: data.name, 
              phone: data.phone, 
              relation: data.relation 
          };
          setContacts(prev => [...prev, newContact]);
          showNotification(t('contacts'), `${t('contact_added')} ${contactData.name}`, 'success');
      }
  };

  const updateContact = async (id: string, contactData: Partial<Contact>) => {
      if (isDemoMode) {
          setContacts(prev => prev.map(c => c.id === id ? { ...c, ...contactData } : c));
          showNotification(t('contacts'), t('changes_saved'), 'success');
          return;
      }

      const dbPayload: any = {};
      if (contactData.name) dbPayload.name = contactData.name;
      if (contactData.phone) dbPayload.phone = contactData.phone;
      if (contactData.relation) dbPayload.relation = contactData.relation;
      if (contactData.customRingtone) dbPayload.custom_ringtone = contactData.customRingtone;

      const { error } = await supabase.from('contacts').update(dbPayload).eq('id', id);
      if (!error) {
          setContacts(prev => prev.map(c => c.id === id ? { ...c, ...contactData } : c));
          showNotification(t('contacts'), t('changes_saved'), 'success');
      }
  };

  // --- Helper Methods ---
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('app_lang', language);
  }, [language]);

  const t = (key: string): string => {
    const dict = translations[language] || translations['en'];
    return dict[key] || key;
  };

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleLanguage = () => setLanguage(language === 'ar' ? 'en' : 'ar');

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
      setNotificationSettings(prev => {
          const next = { ...prev, ...settings };
          localStorage.setItem('ziyarat_notif_settings', JSON.stringify(next));
          return next;
      });
  };

  const playSound = (typeOrBase64: SoundType | string) => {
      if (!notificationSettings.soundEnabled) return;
      try {
          if (soundTimeoutRef.current) {
              clearTimeout(soundTimeoutRef.current);
              audioRef.current.pause();
          }
          let src = '';
          if (typeOrBase64.startsWith('data:audio')) {
              src = typeOrBase64;
          } else {
              src = SOUNDS[typeOrBase64 as SoundType] || SOUNDS['default'];
          }
          audioRef.current.src = src;
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(e => console.log("Audio play blocked", e));
          soundTimeoutRef.current = window.setTimeout(() => {
              audioRef.current.pause();
          }, 5000);
      } catch (e) { console.error("Sound error", e); }
  };

  const showNotification = (title: string, body: string, type: 'info' | 'success' | 'error' = 'info', senderId?: string) => {
      if (!notificationSettings.enabled) return;

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

      if (notificationSettings.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
      }

      let soundToPlay: string = user?.soundPreference || 'default';
      if (senderId) {
          const contactId = senderId.replace('u_temp_', ''); 
          const contact = contacts.find(c => c.id === contactId);
          if (contact && contact.customRingtone) {
              soundToPlay = contact.customRingtone;
          }
      }
      playSound(soundToPlay);
  };

  const dismissActiveNotification = () => setActiveNotification(null);
  const markNotificationsAsRead = () => setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
  
  const shareApp = () => { /* ... */ };
  const exportVisitsToCSV = () => { /* ... */ };

  return (
    <AppContext.Provider value={{
      user, visits, contacts, isLoading, isDemoMode,
      activeNotification, notificationsList, language, t,
      setLanguage, toggleLanguage, enableDemoMode, loginWithPhone, verifyOtp, logout, refreshData, 
      addVisit, changeVisitStatus, updateUserProfile, addNewContact, updateContact,
      dismissActiveNotification, markNotificationsAsRead, showNotification, exportVisitsToCSV,
      playSound, shareApp, updateNotificationSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
