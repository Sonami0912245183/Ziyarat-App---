
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, BellOff, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header = ({ title }: { title?: string }) => {
  const { user, t, notificationsList, markNotificationsAsRead } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notificationsList.filter(n => !n.read).length;

  const toggleNotifications = () => {
      if (!isOpen) {
          markNotificationsAsRead();
      }
      setIsOpen(!isOpen);
  };

  const handleMarkAllRead = () => {
    markNotificationsAsRead();
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md z-40 px-5 py-4 shadow-sm flex justify-between items-center border-b border-gray-100 transition-all">
      <div>
        {title ? (
          <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">{title}</h1>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-200 transform hover:rotate-6 transition-transform">
                <span className="text-xl">ز</span>
            </div>
            <h1 className="text-2xl font-black text-brand-900 tracking-tight">{t('app_name')}</h1>
          </div>
        )}
      </div>
      
      {user && (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={toggleNotifications}
                className={`relative p-3 rounded-full transition-all duration-300 active:scale-95 ${isOpen ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
                <Bell size={24} strokeWidth={isOpen ? 2.5 : 2} className={unreadCount > 0 ? 'animate-swing' : ''} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white shadow-sm"></span>
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <>
                    {/* Overlay for mobile */}
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 md:hidden" onClick={() => setIsOpen(false)}></div>
                    
                    {/* Dropdown Container */}
                    <div className="fixed inset-x-4 top-24 md:absolute md:top-14 rtl:md:left-0 rtl:md:right-auto ltr:md:right-0 ltr:md:left-auto md:w-96 bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-slide-up z-50 rtl:origin-top-left ltr:origin-top-right ring-1 ring-black/5">
                        
                        {/* Header */}
                        <div className="bg-white/80 backdrop-blur-md px-5 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-gray-800 text-base">{t('notifications')}</h3>
                                {unreadCount > 0 && <span className="text-[10px] bg-red-50 text-red-600 px-2.5 py-1 rounded-full font-bold border border-red-100">{unreadCount} جديد</span>}
                            </div>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors">
                                    <CheckCircle2 size={14} /> <span>تحديد كمقروء</span>
                                </button>
                            )}
                        </div>
                        
                        {/* List */}
                        <div className="max-h-[65vh] overflow-y-auto scrollbar-hide">
                            {notificationsList.length === 0 ? (
                                <div className="py-16 px-6 text-center text-gray-400 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                        <BellOff size={28} className="opacity-40 text-gray-500" />
                                    </div>
                                    <p className="font-bold text-gray-600 text-sm">{t('no_notifications')}</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notificationsList.map(notif => (
                                        <div key={notif.id} className={`p-5 hover:bg-gray-50 transition-colors relative group ${!notif.read ? 'bg-brand-50/30' : ''}`}>
                                            <div className="flex gap-4">
                                                {/* Icon */}
                                                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm border border-white ${notif.type === 'error' ? 'bg-red-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-brand-500'} ${!notif.read ? 'ring-4 ring-brand-100 animate-pulse' : ''}`}></div>
                                                
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <h4 className={`text-sm text-gray-900 leading-tight ${!notif.read ? 'font-extrabold' : 'font-bold'}`}>{notif.title}</h4>
                                                        <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                    <p className={`text-xs leading-relaxed ${!notif.read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{notif.body}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
                            <button onClick={() => setIsOpen(false)} className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-200/70 transition-colors">
                                {t('close')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
      )}
    </header>
  );
};
