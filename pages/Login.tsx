
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Phone, ArrowLeft, CheckCircle, Globe } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+966', flag: '🇸🇦', key: 'country_sa' }, // Saudi Arabia
  { code: '+971', flag: '🇦🇪', key: 'country_ae' }, // UAE
  { code: '+965', flag: '🇰🇼', key: 'country_kw' }, // Kuwait
  { code: '+973', flag: '🇧🇭', key: 'country_bh' }, // Bahrain
  { code: '+974', flag: '🇶🇦', key: 'country_qa' }, // Qatar
  { code: '+968', flag: '🇴🇲', key: 'country_om' }, // Oman
  { code: '+249', flag: '🇸🇩', key: 'country_sd' }, // Sudan
  { code: '+20', flag: '🇪🇬', key: 'country_eg' },  // Egypt
  { code: '+962', flag: '🇯🇴', key: 'country_jo' }, // Jordan
  { code: '+967', flag: '🇾🇪', key: 'country_ye' }, // Yemen
  { code: '+964', flag: '🇮🇶', key: 'country_iq' }, // Iraq
  { code: '+212', flag: '🇲🇦', key: 'country_ma' }, // Morocco
  { code: '+213', flag: '🇩🇿', key: 'country_dz' }, // Algeria
  { code: '+216', flag: '🇹🇳', key: 'country_tn' }, // Tunisia
  { code: '+218', flag: '🇱🇾', key: 'country_ly' }, // Libya
  { code: '+1', flag: '🇺🇸', key: 'country_us' },   // USA
  { code: '+44', flag: '🇬🇧', key: 'country_uk' },   // UK
];

export const Login = () => {
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+966');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  
  const { login, verifyOtp, t } = useApp();
  const navigate = useNavigate();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 5) {
        setError('رقم الجوال قصير جداً');
        return;
    }
    setIsBusy(true);
    setError('');
    await login(phone, countryCode);
    setIsBusy(false);
    setStep('OTP');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setError('');
    const success = await verifyOtp(otp);
    setIsBusy(false);
    if (success) {
      navigate('/');
    } else {
      setError('رمز التحقق خاطئ (جرب 1234)');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold-50 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="mb-10 relative z-10">
        <div className="w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <span className="text-5xl font-bold text-white">ز</span>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{t('welcome_title')}</h1>
        <p className="text-gray-500 text-lg">{t('welcome_subtitle')}</p>
      </div>

      {step === 'PHONE' ? (
        <form onSubmit={handlePhoneSubmit} className="w-full max-w-sm space-y-5 relative z-10">
          <div className="flex gap-3">
             {/* Country Code Select */}
             <div className="relative w-1/3">
                <select 
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="appearance-none w-full h-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-center font-bold text-gray-700 focus:ring-brand-500 focus:border-brand-500"
                    dir="ltr"
                >
                    {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
             </div>

             {/* Phone Input */}
             <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Phone className="text-gray-400" size={20} />
                </div>
                <input 
                type="tel" 
                className="block w-full p-4 pl-10 text-lg text-gray-900 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-brand-500 focus:border-brand-500 text-left placeholder-gray-300" 
                placeholder="55 000 0000"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                />
             </div>
          </div>

          {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
          
          <button 
            type="submit" 
            disabled={isBusy}
            className="w-full py-4 text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200 focus:ring-4 focus:ring-brand-300 font-bold rounded-2xl text-lg transition-all active:scale-[0.98]"
          >
            {isBusy ? t('sending') : t('login_btn')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="w-full max-w-sm space-y-6 animate-slide-up relative z-10">
          <div className="text-right mb-4">
            <button type="button" onClick={() => setStep('PHONE')} className="text-brand-600 flex items-center gap-1 text-sm font-bold hover:underline">
              <ArrowLeft size={16} /> تغيير الرقم
            </button>
          </div>
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">{t('otp_label')} {countryCode} {phone}</label>
            <input 
              type="text" 
              className="block w-full p-4 text-center text-3xl tracking-[0.5em] font-bold text-gray-900 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-brand-500 focus:border-brand-500 transition-shadow" 
              placeholder="----"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoFocus
            />
             <p className="mt-3 text-xs text-gray-400">Code: 1234</p>
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button 
            type="submit" 
            disabled={isBusy}
            className="w-full py-4 text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200 focus:ring-4 focus:ring-brand-300 font-bold rounded-2xl text-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isBusy ? t('verifying') : <>{t('verify_btn')} <CheckCircle size={20}/></>}
          </button>
        </form>
      )}
    </div>
  );
};
