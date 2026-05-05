// Facade — routes text AI to Groq, vision AI to Gemini.
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  groqChatTurn,
  groqAnalyzeReport,
  groqEstimateMealFromText,
} from './groq';

const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

/* ---------------- Vision: Gemini ---------------- */

export const analyzeFoodImage = async (base64Image) => {
  if (!genAI) throw new Error('VITE_GEMINI_API_KEY is not set');

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Analyze this food image. Identify the dish and estimate nutrition for the visible portion.
Return ONLY valid JSON, no markdown, no backticks. Schema:
{ "name": string, "calories": number, "protein": number, "carbs": number, "fats": number, "serving_size": string, "confidence_percent": number }`;

  const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const mimeMatch = base64Image.match(/^data:(image\/\w+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const result = await model.generateContent([
    prompt,
    { inlineData: { data, mimeType } },
  ]);
  const text = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse food analysis response');
  }
};

export const transcribeReportImage = async (base64Image) => {
  if (!genAI) throw new Error('VITE_GEMINI_API_KEY is not set');

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = 'Transcribe all visible text from this medical/health report image. Return only the raw text, no commentary.';
  const data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
  const mimeMatch = base64Image.match(/^data:(image\/\w+);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const result = await model.generateContent([
    prompt,
    { inlineData: { data, mimeType } },
  ]);
  return result.response.text();
};

/* ---------------- Text: Groq (with Gemini fallback) ---------------- */

export const chatWithHealthAI = async (message, history, profile) => {
  try {
    return await groqChatTurn(message, history, profile);
  } catch (err) {
    console.error('Groq chat failed, falling back to Gemini:', err);
    if (!genAI) return "Sorry, I'm having trouble thinking right now. Please try again later.";
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const chat = model.startChat({
        history: history.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        })),
        generationConfig: { maxOutputTokens: 250 },
      });
      const r = await chat.sendMessage(`As a health and nutrition coach, answer concisely: ${message}`);
      return r.response.text();
    } catch (err2) {
      console.error('Gemini fallback failed:', err2);
      return "Sorry, I'm having trouble thinking right now. Please try again later.";
    }
  }
};

export const analyzeHealthReport = async (reportText) => {
  return groqAnalyzeReport(reportText);
};

export const estimateMealFromText = async (description) => {
  return groqEstimateMealFromText(description);
};

// Re-export the rest of the Groq helpers so call sites can import from one place.
export {
  groqInsight,
  groqMealSuggestions,
  groqWeeklyReport,
} from './groq';
