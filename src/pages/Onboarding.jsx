import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Check, Activity, Moon, Bike,
  Flame, Trophy, ArrowDown, ArrowUp, Equal, Heart,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { calculateTargets } from '../utils/calculations';

const TOTAL_STEPS = 6;
const CURRENT_YEAR = new Date().getFullYear();

const ACTIVITY_OPTIONS = [
  { id: 'sedentary', label: 'Sedentary',     desc: '0 workouts / week',   Icon: Moon },
  { id: 'light',     label: 'Lightly active', desc: '1–2 workouts / week', Icon: Activity },
  { id: 'moderate',  label: 'Moderately active', desc: '3–4 workouts / week', Icon: Bike },
  { id: 'active',    label: 'Very active',    desc: '5–6 workouts / week', Icon: Flame },
  { id: 'athlete',   label: 'Athlete',        desc: '7+ workouts / week',  Icon: Trophy },
];

const GOAL_OPTIONS = [
  { id: 'lose',     label: 'Lose weight',    desc: 'Burn fat, lean down',  Icon: ArrowDown },
  { id: 'maintain', label: 'Maintain',       desc: 'Stay where you are',   Icon: Equal },
  { id: 'gain',     label: 'Gain muscle',    desc: 'Build mass',           Icon: ArrowUp },
  { id: 'health',   label: 'Improve health', desc: 'Feel & live better',   Icon: Heart },
];

const DIETS = ['Classic', 'Pescatarian', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-free', 'Other'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { saveOnboardingData, showToast } = useAppContext();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    gender: '',
    activityLevel: '',
    height: 170,
    weight: 70,
    dob: { day: 1, month: 1, year: 2000 },
    goal: '',
    diet: '',
  });

  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const targets = useMemo(() => calculateTargets(formData), [formData]);

  const complete = () => {
    saveOnboardingData({ ...formData, targets, createdAt: new Date().toISOString() });
    showToast('Profile saved — let\'s go!', 'success');
    navigate('/app');
  };

  const canContinue = () => {
    switch (step) {
      case 1: return !!formData.gender;
      case 2: return !!formData.activityLevel;
      case 3: return formData.height >= 100 && formData.weight >= 30;
      case 4: return !!formData.goal && formData.dob.year >= 1920 && formData.dob.year <= CURRENT_YEAR;
      case 5: return !!formData.diet;
      default: return true;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ padding: '20px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        {step > 1 && (
          <button
            onClick={back}
            aria-label="Back"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <ChevronLeft size={20} color="var(--text-secondary)" />
          </button>
        )}
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i < step ? 'var(--primary)' : 'var(--border-color)',
                transition: 'background-color 0.3s',
              }}
            />
          ))}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>
          {step}/{TOTAL_STEPS}
        </div>
      </div>

      <div className="container fade-in" style={{ padding: '24px 20px 100px' }}>
        {step === 1 && (
          <Step
            title="What's your gender?"
            sub="This helps us personalise your nutrition targets."
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { id: 'male', label: 'Male', emoji: '👨' },
                { id: 'female', label: 'Female', emoji: '👩' },
                { id: 'other', label: 'Other', emoji: '🧑' },
              ].map(g => (
                <button
                  key={g.id}
                  className={`card selectable-card ${formData.gender === g.id ? 'selected' : ''}`}
                  onClick={() => set('gender', g.id)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 12px', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32 }}>{g.emoji}</div>
                  <div className="text-sm font-semibold">{g.label}</div>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step
            title="How active are you?"
            sub="Pick what matches your typical week."
          >
            {ACTIVITY_OPTIONS.map(a => (
              <button
                key={a.id}
                onClick={() => set('activityLevel', a.id)}
                className={`card selectable-card ${formData.activityLevel === a.id ? 'selected' : ''}`}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <div className="icon-bubble tile-mint"><a.Icon size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold">{a.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </Step>
        )}

        {step === 3 && (
          <Step
            title="Height & weight"
            sub="We need these to calculate your daily targets."
          >
            <div className="card mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Height</span>
                <span className="text-lg font-extrabold" style={{ color: 'var(--primary-dark)' }}>{formData.height} cm</span>
              </div>
              <input
                type="range" min="120" max="220"
                value={formData.height}
                onChange={(e) => set('height', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Weight</span>
                <span className="text-lg font-extrabold" style={{ color: 'var(--primary-dark)' }}>{formData.weight} kg</span>
              </div>
              <input
                type="range" min="35" max="200"
                value={formData.weight}
                onChange={(e) => set('weight', Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step
            title="Your birth year & goal"
            sub="So we can tune your calorie target."
          >
            <div className="card mb-3">
              <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: 6 }}>Year of birth</label>
              <input
                type="number"
                className="input"
                min="1920"
                max={CURRENT_YEAR}
                value={formData.dob.year}
                onChange={(e) => set('dob', { ...formData.dob, year: Number(e.target.value) })}
              />
            </div>
            <div className="text-sm font-semibold mb-2">Goal</div>
            {GOAL_OPTIONS.map(g => (
              <button
                key={g.id}
                onClick={() => set('goal', g.id)}
                className={`card selectable-card ${formData.goal === g.id ? 'selected' : ''}`}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 12,
                  textAlign: 'left', cursor: 'pointer',
                  padding: 14, marginBottom: 10,
                }}
              >
                <div className="icon-bubble tile-violet"><g.Icon size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold">{g.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{g.desc}</div>
                </div>
              </button>
            ))}
          </Step>
        )}

        {step === 5 && (
          <Step
            title="Any dietary preference?"
            sub="We'll filter suggestions to match your style."
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {DIETS.map(d => (
                <button
                  key={d}
                  onClick={() => set('diet', d)}
                  className={`card selectable-card ${formData.diet === d ? 'selected' : ''}`}
                  style={{ padding: 14, textAlign: 'center', cursor: 'pointer' }}
                >
                  <div className="text-sm font-semibold">{d}</div>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 6 && (
          <CompleteStep targets={targets} onComplete={complete} />
        )}

        {/* Continue button */}
        {step < TOTAL_STEPS && (
          <button
            className="btn"
            onClick={next}
            disabled={!canContinue()}
            style={{ marginTop: 24 }}
          >
            Continue <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function Step({ title, sub, children }) {
  return (
    <div className="fade-in">
      <h1 className="text-2xl font-extrabold mb-1">{title}</h1>
      {sub && <p className="text-sm mb-6">{sub}</p>}
      {children}
    </div>
  );
}

function CompleteStep({ targets, onComplete }) {
  return (
    <div className="text-center fade-in">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div className="icon-bubble" style={{
          width: 72, height: 72,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          color: '#fff',
          boxShadow: '0 8px 20px rgba(20,184,166,0.35)',
        }}>
          <Check size={32} />
        </div>
      </div>
      <h1 className="text-2xl font-extrabold mb-1">You're all set!</h1>
      <p className="text-sm mb-6">Here are your personalised daily targets.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left' }}>
        <div className="tile tile-mint" style={{ padding: 14 }}>
          <div className="text-2xl font-extrabold">{targets.calories}</div>
          <div className="text-xs" style={{ opacity: 0.85 }}>kcal / day</div>
        </div>
        <div className="tile tile-violet" style={{ padding: 14 }}>
          <div className="text-2xl font-extrabold">{targets.protein}g</div>
          <div className="text-xs" style={{ opacity: 0.85 }}>Protein</div>
        </div>
        <div className="tile tile-amber" style={{ padding: 14 }}>
          <div className="text-2xl font-extrabold">{targets.carbs}g</div>
          <div className="text-xs" style={{ opacity: 0.85 }}>Carbs</div>
        </div>
        <div className="tile tile-pink" style={{ padding: 14 }}>
          <div className="text-2xl font-extrabold">{targets.fats}g</div>
          <div className="text-xs" style={{ opacity: 0.85 }}>Fats</div>
        </div>
      </div>

      <button className="btn mt-6" onClick={onComplete}>
        Start tracking
      </button>
    </div>
  );
}
