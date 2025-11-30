
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { suggestMessage } from '../services/geminiService';
import { Users, Clock, Calendar as CalendarIcon, MessageSquare, Sparkles, ChevronRight, ChevronLeft, MapPin, CheckCircle2, CalendarPlus, ExternalLink } from 'lucide-react';

export const CreateVisit = () => {
  const { contacts, user, addVisit, t } = useApp();
  const navigate = useNavigate();
  
  const [visitType, setVisitType] = useState<'OUTGOING' | 'INCOMING'>('OUTGOING');
  // Changed from single ID to array of IDs
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Date & Time State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to get first selected contact for prompts
  const primaryContact = contacts.find(c => c.id === selectedContactIds[0]);

  const toggleContact = (id: string) => {
      setSelectedContactIds(prev => 
          prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      );
  };

  // --- Calendar Logic ---
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
      const newDate = new Date(currentMonth);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentMonth(newDate);
  };

  const handleDateClick = (day: number) => {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${dayStr}`);
  };

  // Generate Time Slots (08:00 to 23:30)
  const timeSlots = [];
  for (let i = 8; i < 24; i++) {
      const hour = i < 10 ? `0${i}` : i;
      timeSlots.push(`${hour}:00`);
      if (i !== 24) timeSlots.push(`${hour}:30`);
  }

  // --- Cal.com Logic ---
  const getCalComLink = () => {
      // OUTGOING: Link to the Contact's calendar (if 1 contact selected)
      if (visitType === 'OUTGOING') {
          if (selectedContactIds.length !== 1) return null;
          const contact = contacts.find(c => c.id === selectedContactIds[0]);
          if (!contact?.calComUsername) return null;
          
          const username = contact.calComUsername.replace(/https?:\/\/(www\.)?cal\.com\//, '').replace(/\/$/, '');
          const params = new URLSearchParams();
          if (selectedDate) params.append('date', selectedDate);
          params.append('name', user?.fullName || '');
          params.append('notes', `Proposed time: ${selectedTime || 'Flexible'}. ${notes}`);
          
          return `https://cal.com/${username}?${params.toString()}`;
      } 
      
      // INCOMING: Link to My calendar (to share)
      if (visitType === 'INCOMING') {
          if (!user?.calComUsername) return null;
          
          const username = user.calComUsername.replace(/https?:\/\/(www\.)?cal\.com\//, '').replace(/\/$/, '');
          const params = new URLSearchParams();
          if (selectedDate) params.append('date', selectedDate);
          
          return `https://cal.com/${username}?${params.toString()}`;
      }
      return null;
  };

  const calLink = getCalComLink();

  // --- AI & Submit Logic ---
  const handleAiSuggest = async () => {
    if (selectedContactIds.length === 0 || !selectedDate || !selectedTime) {
        alert("الرجاء اختيار شخص واحد على الأقل والوقت أولاً");
        return;
    }
    
    setIsGenerating(true);
    // If multiple people, just use the first name or a generic "Group" context
    const name = selectedContactIds.length > 1 ? 'الجميع' : (primaryContact?.name || '');

    const suggested = await suggestMessage('invite', { 
        name: name, 
        date: selectedDate, 
        time: selectedTime 
    });
    setNotes(suggested);
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || selectedContactIds.length === 0) return;
    
    // Create a visit for EACH selected contact
    for (const contactId of selectedContactIds) {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) continue;

        const hostId = visitType === 'OUTGOING' ? ('u_temp_' + contact.id) : user.id;
        const hostName = visitType === 'OUTGOING' ? contact.name : user.fullName;
        const visitorId = visitType === 'OUTGOING' ? user.id : ('u_temp_' + contact.id);
        const visitorName = visitType === 'OUTGOING' ? user.fullName : contact.name;
        
        const locationCoords = visitType === 'INCOMING' && user.location 
            ? user.location 
            : undefined;

        await addVisit({
            hostId,
            hostName,
            visitorId,
            visitorName,
            date: selectedDate,
            time: selectedTime,
            guests, // Note: Guests number applies to each visit request
            notes,
            locationName: visitType === 'OUTGOING' ? 'منزل المضيف' : (user.city || 'منزلي'),
            locationCoords
        });
    }

    navigate('/');
  };

  // --- Calendar Render Helpers ---
  const renderCalendarDays = () => {
      const totalDays = daysInMonth(currentMonth);
      const startDay = firstDayOfMonth(currentMonth); 
      
      const blanks = Array.from({ length: startDay }, (_, i) => <div key={`blank-${i}`} className="p-2"></div>);
      const days = Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isSelected = selectedDate === dateStr;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          return (
              <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
                    h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${isSelected ? 'bg-brand-600 text-white shadow-md scale-110' : 'hover:bg-brand-50 text-gray-700'}
                    ${isToday && !isSelected ? 'border-2 border-brand-200 text-brand-600' : ''}
                  `}
              >
                  {day}
              </button>
          );
      });

      return [...blanks, ...days];
  };

  return (
    <div className="animate-fade-in pb-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Visit Type Toggle */}
        <div className="bg-gray-100 p-1 rounded-2xl flex relative">
            <button
                type="button"
                onClick={() => setVisitType('OUTGOING')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${visitType === 'OUTGOING' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                أريد زيارتهم
            </button>
            <button
                type="button"
                onClick={() => setVisitType('INCOMING')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${visitType === 'INCOMING' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                أدعوهم لزيارتي
            </button>
        </div>

        {/* Multi-Select Contact Grid */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users size={18} className="text-brand-500" /> 
                    {visitType === 'OUTGOING' ? 'من تريد زيارته؟' : 'من تريد دعوته؟'}
                </label>
                {selectedContactIds.length > 0 && (
                    <span className="text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full font-bold">
                        {selectedContactIds.length} {t('selected')}
                    </span>
                )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1">
                {contacts.length === 0 ? (
                    <p className="col-span-full text-center text-gray-400 text-xs py-4">لا توجد جهات اتصال. أضف بعضاً منها من القائمة.</p>
                ) : (
                    contacts.map(c => {
                        const isSelected = selectedContactIds.includes(c.id);
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => toggleContact(c.id)}
                                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all relative ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-brand-200 bg-gray-50'}`}
                            >
                                {isSelected && (
                                    <div className="absolute top-2 right-2 text-brand-600">
                                        <CheckCircle2 size={16} fill="currentColor" className="text-white" />
                                    </div>
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-brand-200 text-brand-800' : 'bg-white text-gray-500 shadow-sm'}`}>
                                    {c.name[0]}
                                </div>
                                <span className={`text-xs font-bold truncate w-full text-center ${isSelected ? 'text-brand-900' : 'text-gray-700'}`}>{c.name}</span>
                            </button>
                        );
                    })
                )}
            </div>
            <input type="text" className="opacity-0 w-0 h-0 absolute" required value={selectedContactIds.join(',')} onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('الرجاء اختيار شخص واحد على الأقل')} onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')} />
        </div>

        {/* Interactive Calendar Grid */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                 <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <CalendarIcon size={18} className="text-brand-500" /> تاريخ الزيارة
                </label>
                 <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1" dir="ltr">
                     <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-md"><ChevronLeft size={18} /></button>
                     <span className="text-xs font-bold w-24 text-center">
                         {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                     </span>
                     <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-md"><ChevronRight size={18} /></button>
                 </div>
            </div>
            
            <div className="mb-2 grid grid-cols-7 text-center text-xs font-bold text-gray-400">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 justify-items-center">
                {renderCalendarDays()}
            </div>
            {selectedDate && (
                <div className="mt-4 text-center bg-brand-50 text-brand-700 p-2 rounded-xl text-sm font-bold">
                    تم اختيار: {selectedDate}
                </div>
            )}
            <input type="text" value={selectedDate} required className="opacity-0 h-0 w-0 absolute" onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity('الرجاء اختيار التاريخ')} onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')} />
        </div>

        {/* Time Dropdown */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
             <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock size={18} className="text-brand-500" /> وقت الزيارة
            </label>
            <div className="relative">
                <select 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none font-bold text-center text-gray-900 focus:ring-brand-500 focus:border-brand-500"
                >
                    <option value="" disabled>-- اختر الوقت المناسب --</option>
                    {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-4 text-gray-500">
                    <Clock size={20} />
                </div>
            </div>
        </div>
        
        {/* Cal.com Link Button */}
        {calLink && (
            <div className="animate-fade-in-down">
                <a 
                    href={calLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full p-4 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-black transition-all"
                >
                    <div className="w-6 h-6 bg-white text-black rounded-lg flex items-center justify-center font-bold text-xs">C</div>
                    <span className="font-bold">
                        {visitType === 'OUTGOING' ? 'حجز الموعد عبر Cal.com' : 'شارك رابط الحجز الخاص بك'}
                    </span>
                    <ExternalLink size={16} />
                </a>
                <p className="text-center text-[10px] text-gray-400 mt-2">
                    {visitType === 'OUTGOING' 
                        ? 'المضيف لديه حساب Cal.com، يمكنك الحجز مباشرة.' 
                        : 'يمكنك مشاركة هذا الرابط مع ضيوفك ليختاروا الوقت المناسب.'}
                </p>
            </div>
        )}

        {/* Location Preview (If Incoming) */}
        {visitType === 'INCOMING' && (
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin size={18} className="text-brand-500" /> موقع الزيارة (منزلي)
                </label>
                {user?.location ? (
                    <div className="bg-brand-50 p-3 rounded-xl flex items-center gap-2 text-brand-700 text-sm">
                        <MapPin size={16} />
                        تم تحديد الموقع: {user.city}
                    </div>
                ) : (
                    <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2 text-red-600 text-sm">
                        <MapPin size={16} />
                        لم يتم تحديد الموقع (قم بتحديثه من الملف الشخصي)
                    </div>
                )}
            </div>
        )}

        {/* Guests */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
             <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Users size={18} className="text-brand-500" /> عدد الزوار (لكل دعوة)
            </label>
            <div className="flex items-center gap-4">
                <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 text-xl">-</button>
                <span className="flex-1 text-center text-xl font-bold bg-gray-50 py-2.5 rounded-xl border border-gray-100">{guests}</span>
                <button type="button" onClick={() => setGuests(guests + 1)} className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 font-bold hover:bg-brand-200 text-xl">+</button>
            </div>
        </div>

        {/* Notes with Gemini */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative">
             <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><MessageSquare size={18} className="text-brand-500" /> رسالة {visitType === 'OUTGOING' ? 'الطلب' : 'الدعوة'}</div>
                <button 
                    type="button" 
                    onClick={handleAiSuggest}
                    disabled={isGenerating || selectedContactIds.length === 0 || !selectedDate || !selectedTime}
                    className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                    <Sparkles size={12} /> {isGenerating ? 'جاري الصياغة...' : 'اقترح رسالة'}
                </button>
            </label>
            <textarea 
                rows={3} 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-brand-500 focus:border-brand-500"
                placeholder={visitType === 'OUTGOING' ? "ملاحظة للمضيف..." : "رسالة ترحيبية للضيف..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            ></textarea>
        </div>

        <button 
            type="submit" 
            className="w-full py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 hover:bg-brand-700 transition-transform active:scale-[0.98] text-lg"
        >
            {visitType === 'OUTGOING' 
                ? `إرسال ${selectedContactIds.length} طلبات زيارة` 
                : `إرسال ${selectedContactIds.length} دعوات`
            }
        </button>

      </form>
    </div>
  );
};
