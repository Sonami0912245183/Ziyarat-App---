import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Fallback if no key is provided in this environment
const isConfigured = !!API_KEY;

export const suggestMessage = async (
  context: 'invite' | 'reject' | 'reschedule',
  details: { name: string; date: string; time: string }
): Promise<string> => {
  if (!isConfigured) {
    console.warn("Gemini API Key missing");
    if (context === 'invite') return `السلام عليكم ${details.name}، أود زيارتك يوم ${details.date} الساعة ${details.time}. هل يناسبك ذلك؟`;
    if (context === 'reject') return `أعتذر منك يا ${details.name}، لدي ارتباط آخر في هذا الوقت.`;
    return `مرحباً ${details.name}، هل يمكننا تغيير الموعد إلى وقت آخر؟`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    let prompt = "";
    if (context === 'invite') {
      prompt = `اكتب رسالة واتساب قصيرة، مهذبة جداً، باللهجة السعودية البيضاء، لطلب زيارة ${details.name} في يوم ${details.date} الساعة ${details.time}. اجعلها ودودة.`;
    } else if (context === 'reject') {
      prompt = `اكتب رسالة اعتذار مهذبة جداً لـ ${details.name} عن عدم القدرة على استقبال الزيارة، مع تمني لقاء قريب. قصيرة ومختصرة.`;
    } else {
      prompt = `اكتب رسالة تقترح تغيير موعد الزيارة مع ${details.name}، بأسلوب لبق ومهذب.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Optimize for speed/latency
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "عذراً، حدث خطأ أثناء توليد الرسالة.";
  }
};