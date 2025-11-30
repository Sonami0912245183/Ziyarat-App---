
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { VisitStatus } from '../types';
import { MapPin, Calendar, Clock, Users, Check, X, RefreshCw, CalendarPlus, ExternalLink } from 'lucide-react';

export const VisitDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { visits, user, changeVisitStatus, t } = useApp();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(visits.find(v => v.id === id));
  
  // Reschedule Modal State
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Helper for min date (today) in local time
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const foundVisit = visits.find(v => v.id === id);
    setVisit(foundVisit);
    if (foundVisit) {
        setNewDate(foundVisit.date);
        setNewTime(foundVisit.time);
    }
  }, [visits, id]);

  if (!visit || !user) return <div>Visit not found</div>;

  const isIncoming = visit.hostId === user.id;
  const isPending = visit.status === VisitStatus.PENDING;
  const isActionable = isIncoming && isPending;
  const hasCoordinates = visit.locationCoords && visit.locationCoords.lat && visit.locationCoords.lng;

  const handleAction = async (status: VisitStatus) => {
    await changeVisitStatus(visit.id, status);
    navigate('/');
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await changeVisitStatus(visit.id, VisitStatus.RESCHEDULE_REQUESTED, newDate, newTime);
      setIsRescheduleOpen(false);
      navigate('/');
  };

  const addToCalendar = () => {
      const title = `زيارة: ${isIncoming ? visit.visitorName : visit.hostName}`;
      const details = `زيارة عائلية عبر تطبيق زيارتي. الموقع: ${visit.locationName}`;
      // Format: YYYYMMDDTHHMMSSZ
      const startDate = new Date(`${visit.date}T${visit.time}`).toISOString().replace(/-|:|\.\d\d\d/g, '');
      const endDate = new Date(new Date(`${visit.date}T${visit.time}`).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
      
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(visit.locationName)}`;
      
      window.open(googleUrl, '_blank');
  };

  const openGoogleMaps = () => {
      if (hasCoordinates) {
          const { lat, lng } = visit.locationCoords!;
          window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(visit.locationName)}`, '_blank');
      }
  };

  return (
    <div className={`space-y-6 animate-fade-in relative ${isActionable ? 'pb-24' : ''}`}>
      {/* Map Section */}
      <div className="w-full h-64 bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200 shadow-sm">
        {hasCoordinates ? (
            <iframe 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight={0} 
                marginWidth={0} 
                src={`https://maps.google.com/maps?q=${visit.locationCoords!.lat},${visit.locationCoords!.lng}&z=15&output=embed`}
                className="opacity-90 hover:opacity-100 transition-opacity"
            >
            </iframe>
        ) : (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-500">
                <MapPin size={48} className="text-brand-500 mb-2" />
                <p>موقع {isIncoming ? 'المضيف (أنت)' : 'المضيف'}</p>
                <p className="text-xs text-gray-400 mt-1">{visit.locationName}</p>
            </div>
        )}
        
        {/* Open in Maps Button */}
        <button 
            onClick={openGoogleMaps}
            className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all border border-gray-200"
        >
            <ExternalLink size={18} className="text-blue-600" />
            {t('open_google_maps')}
        </button>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2">
                {isIncoming ? t('role_visitor') : t('role_host')}
            </span>
            <h2 className="text-2xl font-bold text-gray-900">{isIncoming ? visit.visitorName : visit.hostName}</h2>
            <p className="text-gray-500 text-sm mt-1">{isIncoming ? t('visit_incoming_desc') : t('visit_outgoing_desc')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                <Calendar className="text-brand-500" size={20} />
                <div>
                    <p className="text-xs text-gray-400">التاريخ</p>
                    <p className="font-medium text-sm">{visit.date}</p>
                </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                <Clock className="text-brand-500" size={20} />
                <div>
                    <p className="text-xs text-gray-400">الوقت</p>
                    <p className="font-medium text-sm">{visit.time}</p>
                </div>
            </div>
             <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                <Users className="text-brand-500" size={20} />
                <div>
                    <p className="text-xs text-gray-400">الضيوف</p>
                    <p className="font-medium text-sm">{visit.guests} أشخاص</p>
                </div>
            </div>
             <div className="bg-gray-50 p-3 rounded-xl flex items-center gap-3">
                <MapPin className="text-brand-500" size={20} />
                <div className="overflow-hidden">
                    <p className="text-xs text-gray-400">الموقع</p>
                    <p className="font-medium text-sm truncate">{visit.locationName}</p>
                </div>
            </div>
        </div>

        {visit.notes && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800 mb-6">
                <span className="font-bold block mb-1">ملاحظة/رسالة:</span>
                {visit.notes}
            </div>
        )}

        {/* Status Display if not pending */}
        {!isPending && (
             <div className="space-y-3">
                <div className={`text-center p-3 rounded-xl font-bold ${
                    visit.status === VisitStatus.ACCEPTED ? 'bg-green-100 text-green-700' : 
                    visit.status === VisitStatus.REJECTED ? 'bg-red-100 text-red-700' : 
                    visit.status === VisitStatus.RESCHEDULE_REQUESTED ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                    حالة الطلب: {
                        visit.status === VisitStatus.ACCEPTED ? 'تم القبول' : 
                        visit.status === VisitStatus.REJECTED ? 'تم الاعتذار' : 
                        visit.status === VisitStatus.RESCHEDULE_REQUESTED ? 'تم طلب تعديل الموعد' :
                        visit.status
                    }
                </div>
                
                {visit.status === VisitStatus.ACCEPTED && (
                    <button 
                        onClick={addToCalendar}
                        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 p-3 rounded-xl font-bold hover:bg-blue-100"
                    >
                        <CalendarPlus size={20} /> إضافة للتقويم
                    </button>
                )}
             </div>
        )}
      </div>

      {/* Quick Action Bar for Pending Incoming Visits */}
      {isActionable && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                 <button 
                    onClick={() => handleAction(VisitStatus.ACCEPTED)}
                    className="flex flex-col items-center justify-center p-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 rounded-xl active:bg-emerald-100 transition-colors"
                >
                    <Check size={20} className="mb-1" />
                    <span className="text-xs font-bold">قبول</span>
                </button>
                 <button 
                     onClick={() => setIsRescheduleOpen(true)}
                    className="flex flex-col items-center justify-center p-2 bg-amber-50 text-amber-700 border-2 border-amber-100 rounded-xl active:bg-amber-100 transition-colors"
                >
                    <RefreshCw size={20} className="mb-1" />
                    <span className="text-xs font-bold">تغيير الوقت</span>
                </button>
                 <button 
                    onClick={() => handleAction(VisitStatus.REJECTED)}
                    className="flex flex-col items-center justify-center p-2 bg-red-50 text-red-700 border-2 border-red-100 rounded-xl active:bg-red-100 transition-colors"
                >
                    <X size={20} className="mb-1" />
                    <span className="text-xs font-bold">اعتذار</span>
                </button>
            </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl transform transition-all scale-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">اقتراح موعد جديد</h3>
                    <button onClick={() => setIsRescheduleOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ الجديد</label>
                        <input 
                            type="date" 
                            required
                            min={getTodayString()}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">الوقت الجديد</label>
                        <input 
                            type="time" 
                            required
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-brand-500 focus:border-brand-500"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => setIsRescheduleOpen(false)}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                        >
                            إلغاء
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-100"
                        >
                            تأكيد التعديل
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
