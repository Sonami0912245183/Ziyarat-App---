import React, { useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { Notification } from '../types';

interface ToastProps {
  notification: Notification;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    info: 'bg-white border-brand-100',
    success: 'bg-green-50 border-green-100',
    error: 'bg-red-50 border-red-100'
  };

  const icons = {
    info: <Bell className="text-brand-500" size={20} />,
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />
  };

  return (
    <div className={`fixed top-4 left-4 right-4 z-[60] ${bgColors[notification.type]} border rounded-xl shadow-lg p-4 animate-fade-in-down flex items-start gap-3`}>
      <div className="mt-1">{icons[notification.type]}</div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-800 text-sm">{notification.title}</h4>
        <p className="text-gray-600 text-sm mt-1">{notification.body}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    </div>
  );
};