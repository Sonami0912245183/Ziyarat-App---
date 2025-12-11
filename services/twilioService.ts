import { supabase } from './supabaseClient';

/**
 * Sends a Visit Request SMS using a Supabase Edge Function.
 * 
 * ⚠️ PREREQUISITE:
 * You must deploy a Supabase Edge Function named 'send-sms'.
 * 
 * --- EDGE FUNCTION CODE (Deno) ---
 * 
 * import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
 * 
 * const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
 * const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
 * const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
 * 
 * serve(async (req) => {
 *   const { to, message } = await req.json()
 *   
 *   // Create Basic Auth Header
 *   const headers = new Headers()
 *   headers.set('Authorization', 'Basic ' + btoa(accountSid + ":" + authToken))
 *   headers.set('Content-Type', 'application/x-www-form-urlencoded')
 * 
 *   const body = new URLSearchParams({
 *     To: to,
 *     From: fromNumber,
 *     Body: message,
 *   })
 * 
 *   const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
 *     method: 'POST',
 *     headers,
 *     body
 *   })
 * 
 *   const data = await resp.json()
 *   return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } })
 * })
 * 
 * ---------------------------------
 */

const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    const strTime = `${h}:${minutes.padStart(2, '0')} ${ampm}`;
    return strTime;
};

export const sendVisitRequestSMS = async (toPhone: string, visitorName: string, date: string, time24: string) => {
    const formattedTime = formatTime12Hour(time24);
    
    // Message Format: "لديك طلب زيارة من [Name] في يوم [Date] الساعة [Time]"
    const message = `تطبيق زيارتي: لديك طلب زيارة من ${visitorName} في يوم ${date} الساعة ${formattedTime}`;

    try {
        const { data, error } = await supabase.functions.invoke('send-sms', {
            body: {
                to: toPhone,
                message: message
            }
        });

        if (error) {
            console.error('Failed to send SMS via Edge Function:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Error invoking SMS function:', e);
        return false;
    }
};
