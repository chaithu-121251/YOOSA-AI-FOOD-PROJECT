// Groq API wrapper — uses OpenAI-compatible chat-completions endpoint.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

const apiKey = () => import.meta.env.VITE_GROQ_API_KEY;

function extractFirstJsonBlock(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function extractFirstJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

export async function groqChat(messages, opts = {}) {
  const {
    model = DEFAULT_MODEL,
    json = false,
    maxTokens = 600,
    temperature = 0.7,
  } = opts;

  if (!apiKey()) throw new Error('VITE_GROQ_API_KEY is not set');

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (json) body.response_format = { type: 'json_object' };

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';

  if (json) {
    try {
      return JSON.parse(content);
    } catch {
      const obj = extractFirstJsonBlock(content) || extractFirstJsonArray(content);
      if (obj) return obj;
      throw new Error('Groq returned non-JSON content despite json mode');
    }
  }

  return content;
}

/* ---------------- High-level helpers ---------------- */

export async function groqChatTurn(message, history, profile) {
  const sys = `You are Dhillichythanya — a warm, evidence-based nutrition and wellness coach.
Keep replies concise (2-4 sentences), practical, and friendly.
User profile: ${profile ? JSON.stringify({
    goal: profile.goal,
    diet: profile.diet,
    targets: profile.targets,
  }) : 'unknown'}.
Avoid medical diagnosis. Suggest seeing a doctor for medical concerns.`;

  const messages = [
    { role: 'system', content: sys },
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: message },
  ];

  return groqChat(messages, { maxTokens: 350, temperature: 0.6 });
}

export async function groqInsight(profile, todayIntake) {
  const sys = 'You are a nutrition coach. Return ONE concise tip (≤25 words) tailored to the user\'s remaining macros today. No preamble, just the tip.';
  const user = `Goal: ${profile?.goal || 'n/a'}. Diet: ${profile?.diet || 'classic'}.
Targets: ${JSON.stringify(profile?.targets || {})}.
Consumed today: ${JSON.stringify(todayIntake || {})}.
Suggest one specific, actionable food/behaviour tip for the rest of today.`;

  return groqChat(
    [{ role: 'system', content: sys }, { role: 'user', content: user }],
    { maxTokens: 80, temperature: 0.7 }
  );
}

export async function groqMealSuggestions(profile, remaining) {
  const sys = 'You are a nutrition coach. Return ONLY valid JSON, no prose.';
  const user = `Suggest exactly 3 meals that fit: remaining calories ${remaining?.calories || 0} kcal, protein ${remaining?.protein || 0}g, carbs ${remaining?.carbs || 0}g, fats ${remaining?.fats || 0}g. Diet preference: ${profile?.diet || 'classic'}.
Return JSON: { "suggestions": [{ "name": string, "calories": number, "protein": number, "carbs": number, "fats": number, "why": string (≤15 words) }] }`;

  const out = await groqChat(
    [{ role: 'system', content: sys }, { role: 'user', content: user }],
    { json: true, maxTokens: 500, temperature: 0.6 }
  );

  return Array.isArray(out?.suggestions) ? out.suggestions : [];
}

export async function groqEstimateMealFromText(description) {
  const sys = 'You estimate nutrition. Return ONLY valid JSON.';
  const user = `Estimate calories and macros for: "${description}".
Return JSON: { "name": string, "calories": number, "protein": number, "carbs": number, "fats": number, "serving_size": string, "confidence_percent": number }`;

  return groqChat(
    [{ role: 'system', content: sys }, { role: 'user', content: user }],
    { json: true, maxTokens: 250, temperature: 0.4 }
  );
}

export async function groqWeeklyReport(profile, last7Days) {
  const sys = 'You are a nutrition coach. Return ONLY valid JSON, no prose.';
  const user = `Analyze this user's last 7 days of meals.
Profile: ${JSON.stringify({ goal: profile?.goal, diet: profile?.diet, targets: profile?.targets })}.
Daily summaries: ${JSON.stringify(last7Days)}.
Return JSON: { "summary": string (2-3 sentences), "recommendations": [string, string, string], "score": number (0-100) }`;

  const out = await groqChat(
    [{ role: 'system', content: sys }, { role: 'user', content: user }],
    { json: true, maxTokens: 600, temperature: 0.5 }
  );

  return {
    summary: out?.summary || 'Not enough data to generate a report yet.',
    recommendations: Array.isArray(out?.recommendations) ? out.recommendations : [],
    score: typeof out?.score === 'number' ? out.score : null,
  };
}

export async function groqAnalyzeReport(reportText) {
  const sys = 'You are a doctor and nutritionist. Return ONLY valid JSON.';
  const user = `Analyze this medical/health report and provide dietary advice.
Report: ${reportText}
Return JSON: { "bullets": [string, string, string], "calorieAdjustment": number (-500 to +500), "diet_note": string }
The 'bullets' should be 3 concise actionable dietary recommendations.
The 'calorieAdjustment' is the suggested change to daily calories.`;

  const out = await groqChat(
    [{ role: 'system', content: sys }, { role: 'user', content: user }],
    { json: true, maxTokens: 500, temperature: 0.4 }
  );

  return {
    bullets: Array.isArray(out?.bullets) ? out.bullets : [],
    calorieAdjustment: typeof out?.calorieAdjustment === 'number' ? out.calorieAdjustment : 0,
    dietNote: out?.diet_note || '',
  };
}
