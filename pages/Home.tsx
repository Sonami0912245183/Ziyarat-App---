import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Visit, VisitStatus } from '../types';
import { Calendar, Clock, Inbox, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const VisitCard: React.FC<{ visit: Visit; isIncoming: boolean }> = ({ visit, isIncoming }) => {
  const statusColors = {
    [VisitStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [VisitStatus.ACCEPTED]: 'bg-green-100 text-green-800 border-green-200',
    [VisitStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
    [VisitStatus.RESCHEDULE_REQUESTED]: 'bg-orange-100 text-orange-800 border-orange-200',
    [VisitStatus.CANCELLED]: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusLabels = {
    [VisitStatus.PENDING]: 'بانتظار الرد',
    [VisitStatus.ACCEPTED]: 'مقبولة',
    [VisitStatus.REJECTED]: 'مرفوضة',
    [VisitStatus.RESCHEDULE_REQUESTED]: 'طلب تعديل',
    [VisitStatus.CANCELLED]: 'ملغية',
  };

  const avatarInitial = isIncoming ? visit.visitorName[0] : visit.hostName[0];
  const displayName = isIncoming ? visit.visitorName : visit.hostName;
  const displayLabel = isIncoming ? 'يريد زيارتك' : 'أنت تزور';

  return (
    <Link to={`/visit/${visit.id}`} className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 active:scale-[0.98] transition-transform hover:shadow-md">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-sm ${isIncoming ? 'bg-brand-500' : 'bg-blue-500'}`}>
              {avatarInitial}
           </div>
           <div>
              <h3 className="font-bold text-gray-900 text-lg">
                  {displayName}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                  {displayLabel}
              </p>
           </div>
        </div>
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusColors[visit.status]}`}>
          {statusLabels[visit.status]}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 p-2 rounded-xl flex items-center gap-2 text-gray-600">
            <Calendar size={16} className="text-brand-500" />
            <span className="text-sm font-bold">{visit.date}</span>
        </div>
        <div className="bg-gray-50 p-2 rounded-xl flex items-center gap-2 text-gray-600">
            <Clock size={16} className="text-brand-500" />
            <span className="text-sm font-bold">{visit.time}</span>
        </div>
      </div>
    </Link>
  );
};

export const Home = () => {
  const { user, visits, isLoading } = useApp();
  const [activeTab, setActiveTab] = useState<'INCOMING' | 'OUTGOING'>('INCOMING');

  if (isLoading) return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
      <p>جاري تحميل زياراتك...</p>
    </div>
  );

  const incomingVisits = visits.filter(v => v.hostId === user?.id);
  const outgoingVisits = visits.filter(v => v.visitorId === user?.id);

  const currentList = activeTab === 'INCOMING' ? incomingVisits : outgoingVisits;

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 p-4 rounded-2xl">
             <p className="text-xs font-bold text-brand-600 mb-1">زيارات قادمة</p>
             <p className="text-3xl font-bold text-brand-900">
                 {visits.filter(v => v.status === VisitStatus.ACCEPTED).length}
             </p>
         </div>
         <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-4 rounded-2xl">
             <p className="text-xs font-bold text-orange-600 mb-1">بانتظار الرد</p>
             <p className="text-3xl font-bold text-orange-900">
                 {visits.filter(v => v.status === VisitStatus.PENDING).length}
             </p>
         </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
        <button 
            onClick={() => setActiveTab('INCOMING')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'INCOMING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
        >
            <Inbox size={18} />
            الطلبات الواردة
            {incomingVisits.some(v => v.status === VisitStatus.PENDING) && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
        </button>
        <button 
            onClick={() => setActiveTab('OUTGOING')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'OUTGOING' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
        >
             <Send size={18} />
            طلباتي المرسلة
        </button>
      </div>

      {/* List */}
      <div>
          {currentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                  <Inbox size={48} className="mb-3 opacity-20" />
                  <p className="font-medium">لا توجد زيارات في هذه القائمة</p>
              </div>
          ) : (
              currentList.map(visit => (
                  <VisitCard key={visit.id} visit={visit} isIncoming={activeTab === 'INCOMING'} />
              ))
          )}
      </div>
    </div>
  );
};