import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Contacts } from './pages/Contacts';
import { CreateVisit } from './pages/CreateVisit';
import { VisitDetails } from './pages/VisitDetails';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';
import { Toast } from './components/Toast';

const ProtectedRoute = ({ children }: React.PropsWithChildren) => {
  const { user, isLoading } = useApp();
  
  if (isLoading) return <div className="h-screen flex items-center justify-center">جاري التحميل...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
    const { activeNotification, dismissActiveNotification } = useApp();

    return (
        <>
            {activeNotification && (
                <Toast notification={activeNotification} onClose={dismissActiveNotification} />
            )}
            <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Home />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="new-visit" element={<CreateVisit />} />
                    <Route path="visit/:id" element={<VisitDetails />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="admin" element={<Admin />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

const App = () => {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
};

export default App;