import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { useApp } from '../context/AppContext';

export const Layout = () => {
  const { user } = useApp();
  const location = useLocation();
  
  // Hide nav on login page
  const isAuthPage = location.pathname === '/login';

  const getTitle = () => {
    switch(location.pathname) {
      case '/': return undefined;
      case '/contacts': return 'جهات الاتصال';
      case '/new-visit': return 'طلب زيارة جديدة';
      case '/profile': return 'الملف الشخصي';
      case '/admin': return 'لوحة التحكم';
      default: return undefined;
    }
  }

  if (isAuthPage) return <Outlet />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header title={getTitle()} />
      <main className="flex-1 p-4 pb-24 max-w-md mx-auto w-full">
        <Outlet />
      </main>
      {user && <BottomNav />}
    </div>
  );
};