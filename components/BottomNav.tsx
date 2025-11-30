import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Users, User, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav = () => {
  const { t } = useApp();
  
  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center w-full h-full text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-brand-600 -translate-y-1' : 'text-gray-400 hover:text-gray-600'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-[4.5rem] pb-safe z-50 flex justify-around items-center shadow-[0_-5px_20px_rgba(0,0,0,0.03)] rounded-t-3xl">
      <NavLink to="/" className={navClass}>
        {({ isActive }) => (
            <>
                <Home size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-brand-50' : ''} />
                <span className="mt-1">{t('nav_home')}</span>
            </>
        )}
      </NavLink>
      
      <NavLink to="/contacts" className={navClass}>
        {({ isActive }) => (
            <>
                <Users size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-brand-50' : ''} />
                <span className="mt-1">{t('nav_contacts')}</span>
            </>
        )}
      </NavLink>

      <NavLink to="/new-visit" className="relative -top-6 group">
         <div className="absolute inset-0 bg-brand-300 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
         <div className="bg-brand-600 text-white rounded-full p-3.5 shadow-xl border-[6px] border-gray-50 transform group-hover:scale-105 transition-transform group-active:scale-95">
            <PlusCircle size={32} />
         </div>
      </NavLink>

      <NavLink to="/profile" className={navClass}>
        {({ isActive }) => (
            <>
                <User size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-brand-50' : ''} />
                <span className="mt-1">{t('nav_profile')}</span>
            </>
        )}
      </NavLink>

      <NavLink to="/admin" className={navClass}>
        {({ isActive }) => (
            <>
                <Settings size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-brand-50' : ''} />
                <span className="mt-1">{t('nav_admin')}</span>
            </>
        )}
      </NavLink>
    </nav>
  );
};