import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Logo } from '../components/Logo';
import { Phone, ArrowRight, Loader2, AlertCircle, CheckCircle, Globe } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

const COUNTRY_CODES = [
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
  { code: '+973', flag: '🇧🇭', name: 'البحرين' },
  { code: '+974', flag: '🇶🇦', name: 'قطر' },
  { code: '+968', flag: '🇴🇲', name: 'عمان' },
  { code: '+20',  flag: '🇪🇬', name: 'مصر' },
  { code: '+249', flag: '🇸🇩', name: 'السودان' },
  { code: '+964', flag: '🇮🇶', name: 'العراق' },
  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان' },
  { code: '+970', flag: '🇵🇸', name: 'فلسطين' },
  { code: '+967', flag: '🇾🇪', name: 'اليمن' },
  { code: '+218', flag: '🇱🇾', name: 'ليبيا' },
  { code: '+216', flag: '🇹🇳', name: 'تونس' },
  { code: '+213', flag: '🇩🇿', name: 'الجزائر' },
  { code: '+212', flag: '🇲🇦', name: 'المغرب' },
  { code: '+222', flag: '🇲🇷', name: 'موريتانيا' },
  { code: '+963', flag: '🇸🇾', name: 'سوريا' },
];

export const Login = () => {
  const { loginWithPhone, verifyOtp, t, toggleLanguage, language, enableDemoMode } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+966');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // Helper to ensure strictly E.164 format (e.g., +96650xxxxxxx)
  const formatPhoneNumber = (rawPhone: string, cCode: string) => {
    let clean = rawPhone.trim();
    // 1. Remove all non-digits
    clean = clean.replace(/\D/g, '');
    
    // 2. If user pasted the country code (e.g. 96650...), strip it to avoid duplication
    const cCodeDigits = cCode.replace('+', '');
    if (clean.startsWith(cCodeDigits)) {
        clean = clean.substring(cCodeDigits.length);
    }

    // 3. Remove leading zeros (e.g. 050... becomes 50...)
    clean = clean.replace(/^0+/, '');
    
    return `${cCode}${clean}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
        setError('Supabase credentials missing.');
        return;
    }
    setError('');
    setIsBusy(true);

    const fullPhone = formatPhoneNumber(phone, countryCode);
    
    // Basic Validation for KSA (Optional but helpful)
    if (countryCode === '+966' && fullPhone.length !== 13) {
         setError('رقم الجوال السعودي غير صحيح (تأكد من الرقم)');
         setIsBusy(false);
         return;
    }

    console.log("Sending OTP to:", fullPhone);

    const { error: loginError } = await loginWithPhone(fullPhone);
    
    setIsBusy(false);
    if (loginError) {
        console.error("Login Error:", loginError);
        
        // Check for specific backend misconfiguration errors to trigger Demo Mode
        const isBackendError = 
            loginError.includes('Authentication Error') || 
            loginError.includes('invalid username') ||
            loginError.includes('Unsupported phone provider') ||
            loginError.includes('20003');

        if (isBackendError) {
             enableDemoMode();
             setStep('OTP');
             setError('تنبيه: خدمة الرسائل النصية غير مفعلة في الخادم. سيتم الدخول في الوضع التجريبي. رمز الدخول: 123456');
             return;
        }

        // Handle other errors normally
        if (loginError.includes('Signups not allowed')) {
            setError('التسجيل مغلق حالياً من المصدر.');
        } else if (loginError.includes('Too many requests')) {
            setError('محاولات كثيرة جداً، الرجاء الانتظار قليلاً.');
        } else {
            setError(loginError);
        }
    } else {
        setStep('OTP');
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsBusy(true);

    // Ensure we send the EXACT same string we used for login
    const fullPhone = formatPhoneNumber(phone, countryCode);
    
    const { error: verifyError } = await verifyOtp(fullPhone, otp);
    
    setIsBusy(false);
    if (verifyError) {
        console.error("Verify Error:", verifyError);
        if (verifyError.includes('Token has expired') || verifyError.includes('Invalid login credentials')) {
             setError('رمز التحقق خاطئ أو منتهي الصلاحية.');
        } else {
             setError(verifyError);
        }
    } else {
        navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-white">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-brand-50/30 z-0"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-200/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      
      {/* Language Switcher */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors text-xs font-bold text-gray-700 border border-gray-100"
      >
        <Globe size={14} />
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative z-10 animate-fade-in-down">
        
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
                <Logo size="lg" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {t('welcome_title')}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">{t('welcome_subtitle')}</p>
        </div>

        {step === 'PHONE' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                 <div className="flex gap-3">
                     <div className="relative w-1/3">
                        <select 
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="appearance-none w-full h-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-center font-bold text-gray-700 focus:ring-brand-500 focus:border-brand-500 text-sm"
                            dir="ltr"
                        >
                            {COUNTRY_CODES.map(c => (
                                <option key={c.code} value={c.code}>
                                   {c.flag} {c.code}
                                </option>
                            ))}
                        </select>
                     </div>

                     <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Phone className="text-gray-400" size={20} />
                        </div>
                        <input 
                            type="tel" 
                            className="block w-full p-4 pl-10 text-lg text-gray-900 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-brand-500 focus:border-brand-500 text-left" 
                            placeholder="5xxxxxxxxx"
                            dir="ltr"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                     </div>
                  </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center gap-2 text-xs font-bold border border-red-100 animate-pulse text-right">
                        <AlertCircle size={14} className="shrink-0" /> <span className="flex-1">{error}</span>
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isBusy}
                    className="w-full py-4 text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-xl shadow-brand-200 font-bold rounded-2xl text-lg flex items-center justify-center gap-2"
                >
                    {isBusy ? <Loader2 className="animate-spin" /> : (
                        <>
                            {t('login_btn')} <ArrowRight size={20} className="rtl:rotate-180" />
                        </>
                    )}
                </button>
            </form>
        ) : (
             <form onSubmit={handleOtpSubmit} className="space-y-6 animate-slide-up">
                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-4">{t('otp_label')} {formatPhoneNumber(phone, countryCode)}</p>
                    <input 
                        type="text" 
                        className="block w-full p-4 text-center text-4xl tracking-[0.5em] font-black text-gray-900 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-brand-500 focus:border-brand-500" 
                        placeholder="----"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="bg-amber-50 text-amber-700 p-3 rounded-xl text-xs font-bold border border-amber-200 text-center">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={isBusy}
                    className="w-full py-4 text-white bg-brand-600 font-bold rounded-2xl text-lg flex items-center justify-center gap-2"
                >
                    {isBusy ? <Loader2 className="animate-spin" /> : <>{t('verify_btn')} <CheckCircle size={20}/></>}
                </button>
                
                <button type="button" onClick={() => setStep('PHONE')} className="w-full text-sm text-gray-400 hover:text-gray-600 font-bold">
                    {t('cancel')}
                </button>
            </form>
        )}
      </div>
    </div>
  );
};
