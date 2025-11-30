
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LogOut, MapPin, Globe, Shield, Save, Camera, X, User as UserIcon, Phone, Share2, BellRing, Upload, Check } from 'lucide-react';
import { PrivacySettings, Language, SoundType } from '../types';

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export const Profile = () => {
  const { user, logout, updateUserProfile, setLanguage, language, t, playSound, shareApp } = useApp();
  const [calComUser, setCalComUser] = useState(user?.calComUsername || '');
  const [isCalComEditing, setIsCalComEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mp3InputRef = useRef<HTMLInputElement>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  
  // Profile Editing State
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Sound Pref
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<string>(user?.soundPreference || 'default');

  useEffect(() => {
      if (user) {
          setEditName(user.fullName);
          setEditPhone(user.phone);
          setCalComUser(user.calComUsername || '');
          setSelectedSound(user.soundPreference || 'default');
      }
  }, [user]);

  if (!user) return null;

  // --- Handlers ---

  const handleSaveProfile = async () => {
      await updateUserProfile({
          fullName: editName,
          phone: editPhone
      });
      setIsProfileEditing(false);
  };

  const handleSaveCalCom = async () => {
      const sanitized = calComUser
        .replace(/https?:\/\/(www\.)?cal\.com\//i, '')
        .replace(/\/$/, '');
      
      setCalComUser(sanitized);
      await updateUserProfile({ calComUsername: sanitized });
      setIsCalComEditing(false);
  };

  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              updateUserProfile({ avatarUrl: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleMp3Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          if (file.size > 1000000) { // Limit to ~1MB
              alert("File is too large. Please use a smaller MP3 clip.");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              setSelectedSound(base64);
              playSound(base64); // Preview
          };
          reader.readAsDataURL(file);
      }
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
        alert("Browser does not support geolocation");
        return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            updateUserProfile({
                location: { lat: latitude, lng: longitude },
                city: language === 'ar' ? 'موقعي الحالي (تم التحديث)' : 'Current Location (Updated)'
            });
            setIsLoadingLocation(false);
        },
        (error) => {
            console.error(error);
            setIsLoadingLocation(false);
            if(error.code === error.PERMISSION_DENIED) {
                 alert("Location access denied. Please enable it in your browser settings.");
            } else {
                 alert("Failed to get location.");
            }
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePrivacyToggle = (key: keyof PrivacySettings) => {
      if (!user.privacySettings) return;
      const newSettings = {
          ...user.privacySettings,
          [key]: !user.privacySettings[key]
      };
      // Optimistic update done in AppContext
      updateUserProfile({ privacySettings: newSettings });
  };

  const handleSoundSave = () => {
      // @ts-ignore - allow string for custom sound
      updateUserProfile({ soundPreference: selectedSound });
      setIsSoundModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        {/* Header / Avatar / Basic Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-500 to-brand-600 opacity-10"></div>
             
             <div className="relative inline-block mb-4 group cursor-pointer mt-4" onClick={handleAvatarClick}>
                <img 
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.fullName}&background=random`} 
                    alt="Profile" 
                    className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover" 
                />
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                </div>
                <button className="absolute bottom-1 right-1 bg-brand-600 text-white p-2 rounded-full border-2 border-white shadow-sm hover:bg-brand-700 transform hover:scale-110 transition-transform">
                     <Camera size={14} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                />
            </div>

            {isProfileEditing ? (
                <div className="space-y-3 max-w-xs mx-auto animate-fade-in">
                    <div className="relative">
                        <UserIcon size={16} className="absolute top-3 left-3 text-gray-400" />
                        <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full pl-8 p-2 border border-brand-200 rounded-xl text-center font-bold focus:ring-brand-500 focus:border-brand-500 bg-brand-50"
                            placeholder={t('full_name')}
                        />
                    </div>
                    <div className="relative">
                        <Phone size={16} className="absolute top-3 left-3 text-gray-400" />
                        <input 
                            type="tel" 
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full pl-8 p-2 border border-brand-200 rounded-xl text-center text-sm dir-ltr focus:ring-brand-500 focus:border-brand-500 bg-brand-50"
                            placeholder={t('phone_label')}
                        />
                    </div>
                    <div className="flex gap-2 justify-center mt-2">
                        <button onClick={() => setIsProfileEditing(false)} className="px-4 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg">{t('cancel')}</button>
                        <button onClick={handleSaveProfile} className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 rounded-lg shadow-md">{t('save')}</button>
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
                        {user.fullName}
                        <button onClick={() => setIsProfileEditing(true)} className="text-gray-300 hover:text-brand-600 transition-colors"><Save size={16} /></button>
                    </h2>
                    <p className="text-gray-500 dir-ltr font-mono text-sm mt-1">{user.phone}</p>
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-400 mt-2 bg-gray-50 inline-block px-3 py-1 rounded-full">
                        <MapPin size={14} />
                        <span>{user.city}</span>
                    </div>
                </div>
            )}
            
            {/* Share App Button */}
            <button 
                onClick={shareApp}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl shadow-lg shadow-brand-200 font-bold active:scale-95 transition-all"
            >
                <Share2 size={18} />
                {t('share_app')}
            </button>
        </div>

        {/* Cal.com Integration */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 text-gray-800 mb-2 font-bold">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                    <span className="font-bold text-lg">C</span>
                </div>
                <div>
                    <div>{t('calcom_link')}</div>
                    <p className="text-xs text-gray-400 font-normal">{t('calcom_desc')}</p>
                </div>
            </div>
            
            <div className="flex gap-2 mt-4">
                <div className="relative flex-1 group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono group-focus-within:text-brand-500">cal.com/</span>
                    <input 
                        type="text" 
                        value={calComUser}
                        onChange={(e) => setCalComUser(e.target.value)}
                        disabled={!isCalComEditing}
                        className="w-full pl-3 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm dir-ltr text-right disabled:opacity-60 disabled:bg-gray-50 focus:bg-white focus:ring-brand-500 focus:border-brand-500 transition-all"
                        placeholder="username"
                    />
                </div>
                {isCalComEditing ? (
                    <button onClick={handleSaveCalCom} className="bg-brand-600 text-white w-12 rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center shadow-lg shadow-brand-100">
                        <Save size={20} />
                    </button>
                ) : (
                    <button onClick={() => setIsCalComEditing(true)} className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
                        {t('edit')}
                    </button>
                )}
            </div>
        </div>

        {/* Action Buttons List */}
        <div className="space-y-3">
            <button 
                onClick={handleUpdateLocation}
                disabled={isLoadingLocation}
                className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.99] transition-all hover:bg-gray-50"
            >
                <div className="flex items-center gap-4 text-gray-700">
                    <div className={`p-3 rounded-xl ${isLoadingLocation ? 'bg-gray-100 animate-pulse' : 'bg-brand-50 text-brand-600'}`}>
                         <MapPin size={22} className={isLoadingLocation ? 'text-gray-400' : ''} />
                    </div>
                    <div className="text-right">
                        <span className="block font-bold text-sm">{t('update_location')}</span>
                        <span className="text-xs text-gray-400">{isLoadingLocation ? t('loading') : user.city}</span>
                    </div>
                </div>
                <div className="text-brand-600 text-xs font-bold bg-brand-50 px-3 py-1 rounded-lg">{t('update')}</div>
            </button>
            
             <button 
                onClick={() => setIsLangModalOpen(true)}
                className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.99] transition-all hover:bg-gray-50"
            >
                <div className="flex items-center gap-4 text-gray-700">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                        <Globe size={22} />
                    </div>
                    <span className="font-bold text-sm">{t('language')}</span>
                </div>
                <span className="text-gray-600 text-xs font-bold bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                    {LANGUAGES.find(l => l.code === language)?.name}
                </span>
            </button>
            
             <button 
                onClick={() => setIsSoundModalOpen(true)}
                className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.99] transition-all hover:bg-gray-50"
            >
                <div className="flex items-center gap-4 text-gray-700">
                    <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                        <BellRing size={22} />
                    </div>
                    <span className="font-bold text-sm">{t('custom_ringtone')}</span>
                </div>
                <span className="text-gray-600 text-xs font-bold bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                   {selectedSound.startsWith('data:') ? 'Custom MP3' : (selectedSound === 'default' ? 'Default' : selectedSound)}
                </span>
            </button>

             <button 
                onClick={() => setIsPrivacyModalOpen(true)}
                className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 active:scale-[0.99] transition-all hover:bg-gray-50"
            >
                <div className="flex items-center gap-4 text-gray-700">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                        <Shield size={22} />
                    </div>
                    <span className="font-bold text-sm">{t('privacy')}</span>
                </div>
            </button>
        </div>

        <button 
            onClick={logout}
            className="w-full py-4 text-red-500 bg-red-50 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 mt-6"
        >
            <LogOut size={20} /> {t('logout')}
        </button>

        {/* Language Modal */}
        {isLangModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform transition-all scale-100">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-gray-800">{t('language')}</h3>
                        <button onClick={() => setIsLangModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                        {LANGUAGES.map((lang) => (
                             <button 
                                key={lang.code}
                                onClick={() => {
                                    setLanguage(lang.code);
                                    setIsLangModalOpen(false);
                                }}
                                className={`p-3 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${language === lang.code ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 hover:border-brand-200'}`}
                             >
                                <span className="text-2xl">{lang.flag}</span>
                                <span className="font-bold text-sm">{lang.name}</span>
                             </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Sound Selection Modal */}
        {isSoundModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform transition-all scale-100">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-gray-800">{t('custom_ringtone')}</h3>
                        <button onClick={() => setIsSoundModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto">
                        {/* Preset Sounds */}
                        {(['default', 'chime', 'bell', 'futuristic'] as SoundType[]).map((type) => (
                             <button 
                                key={type}
                                onClick={() => {
                                    setSelectedSound(type);
                                    playSound(type);
                                }}
                                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${selectedSound === type ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                             >
                                <span className="font-bold">
                                    {type === 'default' ? t('sound_default') : 
                                     type === 'chime' ? t('sound_chime') :
                                     type === 'bell' ? t('sound_bell') :
                                     t('sound_futuristic')}
                                </span>
                                {selectedSound === type && <div className="w-3 h-3 bg-brand-500 rounded-full"></div>}
                             </button>
                        ))}
                        
                        {/* Custom MP3 Upload */}
                        <div className="pt-2 border-t border-gray-100">
                            <button 
                                onClick={() => mp3InputRef.current?.click()}
                                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all ${selectedSound.startsWith('data:') ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Upload size={18} />
                                    <span className="font-bold">{t('upload_sound')}</span>
                                </div>
                                {selectedSound.startsWith('data:') && <Check size={18} className="text-brand-600" />}
                            </button>
                            <input 
                                type="file" 
                                ref={mp3InputRef} 
                                className="hidden" 
                                accept="audio/mp3,audio/mpeg" 
                                onChange={handleMp3Upload} 
                            />
                        </div>
                    </div>
                    
                    <button onClick={handleSoundSave} className="w-full py-3 bg-brand-600 text-white font-bold rounded-2xl shadow-lg">{t('save')}</button>
                </div>
            </div>
        )}

        {/* Privacy Modal */}
        {isPrivacyModalOpen && user.privacySettings && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform transition-all scale-100">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-bold text-gray-800">{t('privacy_settings')}</h3>
                        <button onClick={() => setIsPrivacyModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">استقبال دعوات من العامة</span>
                            <button 
                                onClick={() => handlePrivacyToggle('allowPublicInvites')}
                                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${user.privacySettings.allowPublicInvites ? 'bg-brand-500' : 'bg-gray-200'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${user.privacySettings.allowPublicInvites ? 'translate-x-[-1.25rem]' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">مشاركة الموقع مع الضيوف</span>
                            <button 
                                onClick={() => handlePrivacyToggle('shareLocationWithGuests')}
                                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${user.privacySettings.shareLocationWithGuests ? 'bg-brand-500' : 'bg-gray-200'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${user.privacySettings.shareLocationWithGuests ? 'translate-x-[-1.25rem]' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">إظهار حالة الاتصال</span>
                            <button 
                                onClick={() => handlePrivacyToggle('showOnlineStatus')}
                                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 ${user.privacySettings.showOnlineStatus ? 'bg-brand-500' : 'bg-gray-200'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${user.privacySettings.showOnlineStatus ? 'translate-x-[-1.25rem]' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsPrivacyModalOpen(false)}
                        className="w-full mt-8 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 shadow-lg"
                    >
                        {t('close')}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
