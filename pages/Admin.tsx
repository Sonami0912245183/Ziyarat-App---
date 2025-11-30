
import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Activity, Download } from 'lucide-react';

export const Admin = () => {
  const { visits, user, exportVisitsToCSV, t, contacts } = useApp();

  if (!user?.isAdmin) {
      return <div className="text-center p-10 text-red-500">غير مصرح لك بالدخول هنا</div>;
  }

  // Calculate stats based on "Global" mock data logic
  // In a real app, this would be `contacts.length` or a global user count query.
  const totalConnections = 1240 + contacts.length;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('admin_panel')}</h2>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-brand-600 mb-2">
                    <Activity size={20} />
                    <h3 className="font-bold">{t('total_visits')}</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{visits.length}</p>
                <p className="text-xs text-green-500 mt-1">+12% هذا الأسبوع</p>
            </div>
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Users size={20} />
                    {/* Changed label to reflect Family/Friends/Acquaintances request */}
                    <h3 className="font-bold text-xs">{t('users')}</h3> 
                </div>
                <p className="text-3xl font-bold text-gray-900">{totalConnections}</p>
                <p className="text-xs text-blue-500 mt-1">نشط الآن</p>
            </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">آخر العمليات</h3>
                <button 
                    onClick={exportVisitsToCSV}
                    className="text-xs bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-brand-100 transition-colors"
                >
                    <Download size={14} /> تصدير CSV
                </button>
            </div>
            <div className="space-y-3">
                {visits.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-4">لا توجد زيارات مسجلة</p>
                ) : (
                    visits.slice(0, 5).map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold border border-gray-200 shadow-sm">
                                    {v.visitorName[0]}
                                 </div>
                                 <div>
                                     <p className="text-xs font-bold text-gray-900">{v.visitorName}</p>
                                     <p className="text-[10px] text-gray-400">{v.date}</p>
                                 </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                v.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                v.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {v.status}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};
