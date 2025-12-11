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
    if (context === 'invite') return `Ø§ÙØ³ÙØ§Ù Ø¹ÙÙÙÙ ${details.name}Ø Ø£ÙØ¯ Ø²ÙØ§Ø±ØªÙ ÙÙÙ ${details.date} Ø§ÙØ³Ø§Ø¹Ø© ${details.time}. ÙÙ ÙÙØ§Ø³Ø¨Ù Ø°ÙÙØ`;
    if (context === 'reject') return `Ø£Ø¹ØªØ°Ø± ÙÙÙ ÙØ§ ${details.name}Ø ÙØ¯Ù Ø§Ø±ØªØ¨Ø§Ø· Ø¢Ø®Ø± ÙÙ ÙØ°Ø§ Ø§ÙÙÙØª.`;
    return `ÙØ±Ø­Ø¨Ø§Ù ${details.name}Ø ÙÙ ÙÙÙÙÙØ§ ØªØºÙÙØ± Ø§ÙÙÙØ¹Ø¯ Ø¥ÙÙ ÙÙØª Ø¢Ø®Ø±Ø`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    let prompt = "";
    if (context === 'invite') {
      prompt = `Ø§ÙØªØ¨ Ø±Ø³Ø§ÙØ© ÙØ§ØªØ³Ø§Ø¨ ÙØµÙØ±Ø©Ø ÙÙØ°Ø¨Ø© Ø¬Ø¯Ø§ÙØ Ø¨Ø§ÙÙÙØ¬Ø© Ø§ÙØ³Ø¹ÙØ¯ÙØ© Ø§ÙØ¨ÙØ¶Ø§Ø¡Ø ÙØ·ÙØ¨ Ø²ÙØ§Ø±Ø© ${details.name} ÙÙ ÙÙÙ ${details.date} Ø§ÙØ³Ø§Ø¹Ø© ${details.time}. Ø§Ø¬Ø¹ÙÙØ§ ÙØ¯ÙØ¯Ø©.`;
    } else if (context === 'reject') {
      prompt = `Ø§ÙØªØ¨ Ø±Ø³Ø§ÙØ© Ø§Ø¹ØªØ°Ø§Ø± ÙÙØ°Ø¨Ø© Ø¬Ø¯Ø§Ù ÙÙ ${details.name} Ø¹Ù Ø¹Ø¯Ù Ø§ÙÙØ¯Ø±Ø© Ø¹ÙÙ Ø§Ø³ØªÙØ¨Ø§Ù Ø§ÙØ²ÙØ§Ø±Ø©Ø ÙØ¹ ØªÙÙÙ ÙÙØ§Ø¡ ÙØ±ÙØ¨. ÙØµÙØ±Ø© ÙÙØ®ØªØµØ±Ø©.`;
    } else {
      prompt = `Ø§ÙØªØ¨ Ø±Ø³Ø§ÙØ© ØªÙØªØ±Ø­ ØªØºÙÙØ± ÙÙØ¹Ø¯ Ø§ÙØ²ÙØ§Ø±Ø© ÙØ¹ ${details.name}Ø Ø¨Ø£Ø³ÙÙØ¨ ÙØ¨Ù ÙÙÙØ°Ø¨.`;
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
    return "Ø¹Ø°Ø±Ø§ÙØ Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«ÙØ§Ø¡ ØªÙÙÙØ¯ Ø§ÙØ±Ø³Ø§ÙØ©.";
  }
};