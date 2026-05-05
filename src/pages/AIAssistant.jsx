import { useState, useRef, useEffect } from 'react';
import { Send, Camera, Sparkles } from 'lucide-react';
import { chatWithHealthAI, analyzeFoodImage } from '../services/ai';
import { useAppContext } from '../context/AppContext';
import { todayIntake, remainingMacros } from '../utils/calculations';
import { groqMealSuggestions } from '../services/groq';

export default function AIAssistant() {
  const { user, userData, meals, addMeal, showToast } = useAppContext();
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `Hi ${user?.displayName?.split(' ')[0] || 'there'}! I'm your Dhillichythanya Health AI. Ask me anything about nutrition, get a meal plan, or upload a food photo to log it instantly.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const userMsg = (text ?? input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const response = await chatWithHealthAI(userMsg, messages, userData);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I had trouble responding. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setMessages(prev => [...prev, { role: 'user', text: 'Can you analyze this food?', image: base64 }]);
      setLoading(true);
      try {
        const r = await analyzeFoodImage(base64);
        const summary = `**${r.name || 'Food'}** (${r.serving_size || '1 serving'}) — about ${Math.round(r.calories || 0)} kcal: ${Math.round(r.protein || 0)}g protein, ${Math.round(r.carbs || 0)}g carbs, ${Math.round(r.fats || 0)}g fats.${r.confidence_percent ? ` (${r.confidence_percent}% confident)` : ''}`;
        setMessages(prev => [...prev, {
          role: 'model',
          text: summary,
          action: { label: 'Log this meal', payload: r },
        }]);
      } catch (err) {
        console.error(err);
        setMessages(prev => [...prev, { role: 'model', text: "I couldn't analyze that image. Try a different photo with better lighting." }]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSuggestMeals = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: 'What should I eat next?' }]);
    try {
      const intake = todayIntake(meals);
      const remain = remainingMacros(userData?.targets, intake);
      const suggestions = await groqMealSuggestions(userData, remain);
      if (!suggestions.length) {
        setMessages(prev => [...prev, { role: 'model', text: "I couldn't generate suggestions right now. Try again in a moment." }]);
        return;
      }
      const text = suggestions.map((s, i) => `**${i + 1}. ${s.name}** — ${Math.round(s.calories)} kcal · P${Math.round(s.protein)}/C${Math.round(s.carbs)}/F${Math.round(s.fats)}\n_${s.why || ''}_`).join('\n\n');
      setMessages(prev => [...prev, { role: 'model', text, suggestions }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Couldn't generate suggestions. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = (m) => {
    addMeal({
      name: m.name,
      calories: Math.round(m.calories || 0),
      protein:  Math.round(m.protein  || 0),
      carbs:    Math.round(m.carbs    || 0),
      fats:     Math.round(m.fats     || 0),
    });
    showToast(`${m.name} logged`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      {/* Header */}
      <header style={{
        padding: '14px 16px',
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div className="flex items-center gap-2">
          <div className="icon-bubble" style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: '#fff',
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ margin: 0 }}>Health AI</h2>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Powered by Llama 3.3 · Groq</div>
          </div>
        </div>
      </header>

      {/* Quick prompts */}
      <div className="h-scroll" style={{ padding: '10px 16px 0' }}>
        <Quick onClick={handleSuggestMeals}>What should I eat next?</Quick>
        <Quick onClick={() => send('Suggest a high-protein breakfast that fits my goals.')}>High-protein breakfast</Quick>
        <Quick onClick={() => send('Tips to improve my sleep quality?')}>Better sleep</Quick>
        <Quick onClick={() => send('Healthy snacks under 200 calories.')}>Low-cal snacks</Quick>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: '14px 16px 100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <Message key={i} m={m} user={user} onLogMeal={handleLogMeal} />
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div className="card" style={{ padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div className="loader loader-sm" />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Thinking…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div style={{
        position: 'fixed',
        bottom: 70,
        left: 0, right: 0,
        background: 'var(--card-bg)',
        borderTop: '1px solid var(--border-color)',
        padding: '12px 16px',
        zIndex: 40,
      }}>
        <div className="flex items-center gap-2" style={{ maxWidth: 480, margin: '0 auto' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload food photo"
            style={{
              padding: 10, borderRadius: '50%', border: '1px solid var(--border-color)',
              background: 'var(--bg-color)', color: 'var(--primary-dark)', cursor: 'pointer',
              display: 'flex',
            }}
          >
            <Camera size={18} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask me anything…"
            className="input"
            style={{ flex: 1, borderRadius: 999 }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            aria-label="Send"
            style={{
              padding: 10, borderRadius: '50%', border: 'none',
              background: input.trim() ? 'var(--primary)' : 'var(--border-color)',
              color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Quick({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="chip"
      style={{ flexShrink: 0, cursor: 'pointer' }}
    >
      <Sparkles size={11} /> {children}
    </button>
  );
}

function Message({ m, user, onLogMeal }) {
  const isUser = m.role === 'user';
  return (
    <div style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
      {!isUser && (
        <div className="text-xs flex items-center gap-1 mb-1" style={{ color: 'var(--text-secondary)' }}>
          <Sparkles size={11} color="var(--primary-dark)" /> Dhillichythanya AI
        </div>
      )}
      <div style={{
        background: isUser ? 'var(--primary)' : 'var(--card-bg)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        padding: '10px 14px',
        borderRadius: 16,
        borderBottomRightRadius: isUser ? 4 : 16,
        borderBottomLeftRadius: isUser ? 16 : 4,
        border: isUser ? 'none' : '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {m.image && (
          <img src={m.image} alt="Upload" style={{ width: '100%', borderRadius: 8, marginBottom: 8, maxHeight: 180, objectFit: 'cover' }} />
        )}
        <div className="text-sm" style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {renderMarkdownLite(m.text)}
        </div>
        {m.action && (
          <button
            onClick={() => onLogMeal(m.action.payload)}
            className="btn btn-sm mt-3"
            style={{ width: 'auto' }}
          >
            {m.action.label}
          </button>
        )}
        {m.suggestions && (
          <div className="mt-3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {m.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onLogMeal(s)}
                className="card"
                style={{ textAlign: 'left', cursor: 'pointer', padding: '10px 12px' }}
              >
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(s.calories)} kcal · Tap to log
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Tiny **bold** and *italic* renderer; everything else stays as plain text.
function renderMarkdownLite(text) {
  if (typeof text !== 'string') return text;
  const parts = [];
  let rest = text;
  let key = 0;
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/;
  while (rest.length) {
    const m = rest.match(re);
    if (!m) { parts.push(rest); break; }
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    const token = m[0];
    if (token.startsWith('**')) parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('*') || token.startsWith('_')) parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
    rest = rest.slice(m.index + token.length);
  }
  return parts;
}
