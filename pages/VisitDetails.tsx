import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { VisitStatus } from '../types';
import { MapPin, Calendar, Clock, Users, Check, X, RefreshCw, CalendarPlus, ExternalLink, Navigation } from 'lucide-react';

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

  const mapQuery = hasCoordinates 
    ? `${visit.locationCoords!.lat},${visit.locationCoords!.lng}`
    : encodeURIComponent(visit.locationName);

  return (
    <div className={`space-y-6 animate-fade-in relative ${isActionable ? 'pb-24' : ''}`}>
      {/* Map Section */}
      <div className="w-full h-80 bg-gray-100 rounded-3xl overflow-hidden relative border border-gray-200 shadow-md group">
        <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            scrolling="no" 
            marginHeight={0} 
            marginWidth={0} 
            src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
            className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity grayscale-[20%] group-hover:grayscale-0"
            allowFullScreen
            loading="lazy"
            title="Location Map"
        >
        </iframe>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>

        {/* Location Badge */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 max-w-[85%] z-10">
             <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-brand-600" />
             </div>
             <div className="overflow-hidden">
                <p className="text-[10px] text-gray-500 font-bold">{t('role_host')}</p>
                <p className="text-xs font-bold text-gray-900 truncate">{visit.locationName}</p>
             </div>
        </div>
        
        {/* Navigation Button */}
        <button 
            onClick={openGoogleMaps}
            className="absolute bottom-4 left-4 right-4 bg-white text-gray-900 py-4 rounded-2xl shadow-lg font-bold text-sm flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all border border-gray-100 z-10"
        >
            <div className="bg-blue-600 text-white p-1.5 rounded-full">
                <Navigation size={16} fill="currentColor" />
            </div>
            <span>{t('open_google_maps')}</span>
        </button>
      </div>

      {/* Details */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2">
                {isIncoming ? t('role_visitor') : t('role_host')}
            </span>
            <h2 className="text-2xl font-bold text-gray-900">{isIncoming ? visit.visitorName : visit.hostName}</h2>
            <p className="text-gray-500 text-sm mt-1">{isIncoming ? t('visit_incoming_desc') : t('visit_outgoing_desc')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm">
                    <Calendar size={20} />
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold">التاريخ</p>
                    <p className="font-bold text-sm text-gray-800">{visit.date}</p>
                </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm">
                    <Clock size={20} />
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold">الوقت</p>
                    <p className="font-bold text-sm text-gray-800">{visit.time}</p>
                </div>
            </div>
             <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm">
                    <Users size={20} />
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 font-bold">الضيوف</p>
                    <p className="font-bold text-sm text-gray-800">{visit.guests} أشخاص</p>
                </div>
            </div>
             <div className="bg-gray-50 p-3 rounded-2xl flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-brand-500 shadow-sm">
                    <MapPin size={20} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-[10px] text-gray-400 font-bold">الموقع</p>
                    <p className="font-bold text-sm text-gray-800 truncate">{visit.locationName}</p>
                </div>
            </div>
        </div>

        {visit.notes && (
            <div className="bg-yellow-50 p-5 rounded-2xl border border-yellow-100 text-sm text-yellow-800 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-100 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                <span className="font-bold block mb-1 flex items-center gap-2">
                    ملاحظة
                </span>
                <p className="relative z-10 leading-relaxed">{visit.notes}</p>
            </div>
        )}

        {/* Status Display if not pending */}
        {!isPending && (
             <div className="space-y-3">
                <div className={`text-center p-4 rounded-2xl font-bold flex items-center justify-center gap-2 ${
                    visit.status === VisitStatus.ACCEPTED ? 'bg-green-100 text-green-700' : 
                    visit.status === VisitStatus.REJECTED ? 'bg-red-100 text-red-700' : 
                    visit.status === VisitStatus.RESCHEDULE_REQUESTED ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                    {visit.status === VisitStatus.ACCEPTED && <Check size={20} />}
                    {visit.status === VisitStatus.REJECTED && <X size={20} />}
                    {visit.status === VisitStatus.RESCHEDULE_REQUESTED && <RefreshCw size={20} />}
                    
                    <span>
                    {
                        visit.status === VisitStatus.ACCEPTED ? 'تم القبول' : 
                        visit.status === VisitStatus.REJECTED ? 'تم الاعتذار' : 
                        visit.status === VisitStatus.RESCHEDULE_REQUESTED ? 'تم طلب تعديل الموعد' :
                        visit.status
                    }
                    </span>
                </div>
                
                {visit.status === VisitStatus.ACCEPTED && (
                    <button 
                        onClick={addToCalendar}
                        className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 p-4 rounded-2xl font-bold hover:bg-blue-100 transition-colors"
                    >
                        <CalendarPlus size={20} /> إضافة للتقويم
                    </button>
                )}
             </div>
        )}
      </div>

      {/* Quick Action Bar for Pending Incoming Visits */}
      {isActionable && (
        <div className="fixed bottom-20 left-4 right-4 z-30">
            <div className="bg-gray-900/90 backdrop-blur-md text-white p-2 rounded-3xl shadow-2xl border border-white/10 flex justify-between items-center gap-2 pl-2">
                <div className="flex-1 flex gap-2">
                     <button 
                        onClick={() => handleAction(VisitStatus.REJECTED)}
                        className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-red-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                    >
                        <X size={18} />
                        اعتذار
                    </button>
                     <button 
                         onClick={() => setIsRescheduleOpen(true)}
                        className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-amber-300 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all"
                    >
                        <RefreshCw size={18} />
                        تغيير الوقت
                    </button>
                </div>
                
                 <button 
                    onClick={() => handleAction(VisitStatus.ACCEPTED)}
                    className="py-3 px-8 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm flex flex-col items-center justify-center gap-1 shadow-lg shadow-brand-500/30 transition-all transform active:scale-95"
                >
                    <Check size={24} />
                    قبول
                </button>
            </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl transform transition-all scale-100">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-800">اقتراح موعد جديد</h3>
                    <button onClick={() => setIsRescheduleOpen(false)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-1 rounded-full">
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

                    <div className="flex gap-3 pt-4">
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
