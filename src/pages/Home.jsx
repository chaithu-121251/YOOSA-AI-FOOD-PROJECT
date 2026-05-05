import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, LogOut, Sparkles, FileText, User as UserIcon,
  Stethoscope, Droplet, Flame, Trash2, Lightbulb,
  Heart, Ruler, Activity,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  greeting, initialsOf, calculateAge, calculateBMI, bmiCategory,
  todayIntake, calculateStreak, healthScore, formatTime,
} from '../utils/calculations';
import { groqInsight } from '../services/groq';

export default function Home() {
  const navigate = useNavigate();
  const {
    user, userData, meals, removeMeal, resetData,
    dailyInsight, setDailyInsight, showToast,
  } = useAppContext();

  const [insightLoading, setInsightLoading] = useState(false);

  const intake = useMemo(() => todayIntake(meals), [meals]);
  const streak = useMemo(() => calculateStreak(meals), [meals]);
  const bmi = useMemo(
    () => calculateBMI(userData?.weight, userData?.height),
    [userData]
  );
  const bmiCat = useMemo(() => bmiCategory(bmi), [bmi]);

  const targets = userData?.targets || { calories: 2000, protein: 150, carbs: 200, fats: 65 };
  const score = useMemo(
    () => healthScore({ targets, intake, streak }),
    [targets, intake, streak]
  );

  const todayMeals = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return meals
      .filter(m => m.date && m.date.slice(0, 10) === today)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [meals]);

  const userName =
    user?.displayName?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';

  /* Insight: load once per day */
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (dailyInsight?.date === today && dailyInsight?.text) return;
    if (insightLoading) return;
    setInsightLoading(true);
    groqInsight({ ...userData, targets }, intake)
      .then(text => setDailyInsight(text.trim()))
      .catch(err => {
        console.error('Insight failed:', err);
      })
      .finally(() => setInsightLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {/* ignore */}
    resetData();
    showToast('Signed out', 'success');
    navigate('/');
  };

  return (
    <div className="container fade-in" style={{ padding: '16px 16px 100px' }}>
      {/* Top bar */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} name={userName} />
          <div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{greeting()}</div>
            <div className="text-base font-bold">{userName} <span style={{ fontSize: 18 }}>👋</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconBtn ariaLabel="Notifications" onClick={() => showToast('No new alerts', 'info')}>
            <Bell size={18} color="var(--text-secondary)" />
          </IconBtn>
          <IconBtn ariaLabel="Sign out" onClick={handleLogout} tone="rose">
            <LogOut size={18} color="var(--pastel-pink-fg)" />
          </IconBtn>
        </div>
      </header>

      {/* Health Score */}
      <section className="card mb-4" style={{ padding: '20px' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold mb-1">Health Score</div>
            <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary-dark)', lineHeight: 1 }}>
              {score}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              / 100 · <span style={{ color: scoreLabel(score).color, fontWeight: 600 }}>{scoreLabel(score).label}</span>
            </div>
          </div>
          <ScoreRing value={score} />
        </div>

        {/* Pastel tile row */}
        <div className="mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <Tile className="tile-pink" icon={<Droplet size={16} />} title={userData?.bloodGroup || '—'} subtitle="Blood Group" />
          <Tile className="tile-blue" icon={<Ruler size={16} />} title={`${userData?.height || '—'} cm`} subtitle="Height" />
          <Tile className="tile-mint" icon={<Activity size={16} />} title={bmi ? bmi.toFixed(1) : '—'} subtitle={bmiCat.label} />
        </div>

        <div className="mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {userData?.weight ? `${userData.weight} kg` : ''}
          {userData?.gender ? ` · ${userData.gender}` : ''}
          {userData?.dob ? ` · ${calculateAge(userData.dob)} yrs` : ''}
        </div>
      </section>

      {/* Today's calories ring */}
      <section className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Today's Intake</div>
          <button className="chip chip-secondary" onClick={() => navigate('/app/log')} style={{ cursor: 'pointer' }}>
            View log
          </button>
        </div>
        <div className="flex items-center gap-4">
          <CalorieRing
            consumed={Math.round(intake.calories)}
            target={targets.calories}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <MacroBar label="Protein" color="var(--pastel-violet-fg)" bg="var(--pastel-violet)" used={intake.protein} target={targets.protein} unit="g" />
            <MacroBar label="Carbs"   color="var(--pastel-amber-fg)" bg="var(--pastel-amber)" used={intake.carbs}   target={targets.carbs}   unit="g" />
            <MacroBar label="Fats"    color="var(--pastel-pink-fg)"  bg="var(--pastel-pink)"  used={intake.fats}    target={targets.fats}    unit="g" />
          </div>
        </div>
      </section>

      {/* Streak */}
      <section className="card mb-4 tile-amber" style={{ border: 'none' }}>
        <div className="flex items-center gap-3">
          <div className="icon-bubble" style={{ background: '#fff', color: 'var(--pastel-amber-fg)' }}>
            <Flame size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="text-base font-bold" style={{ color: 'var(--pastel-amber-fg)' }}>
              {streak} day streak
            </div>
            <div className="text-xs" style={{ color: 'var(--pastel-amber-fg)', opacity: 0.85 }}>
              {streak === 0 ? 'Log a meal today to start your streak' : 'Keep going — consistency wins!'}
            </div>
          </div>
        </div>
      </section>

      {/* AI Insight */}
      <section className="card mb-4" style={{ background: 'var(--primary-tint)', borderColor: 'var(--primary-soft)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="icon-bubble" style={{
            width: 28, height: 28, background: 'var(--primary)', color: '#fff',
          }}>
            <Lightbulb size={14} />
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--primary-dark)' }}>
            Today's AI Insight
          </div>
        </div>
        {insightLoading ? (
          <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 6 }} />
        ) : (
          <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {dailyInsight?.text || 'Log your first meal of the day and I\'ll send you a personalised tip.'}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="mb-4">
        <h3 className="text-base font-bold mb-3">Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <ActionTile
            icon={<Sparkles size={18} />} tone="violet" title="Health AI"
            onClick={() => navigate('/app/ai')}
          />
          <ActionTile
            icon={<FileText size={18} />} tone="blue" title="Reports"
            onClick={() => navigate('/app/reports')}
          />
          <ActionTile
            icon={<Stethoscope size={18} />} tone="amber" title="Doctor Requests"
            onClick={() => showToast('Coming soon', 'info')}
          />
          <ActionTile
            icon={<UserIcon size={18} />} tone="violet" title="Profile"
            onClick={() => navigate('/app/profile')}
          />
          <ActionTile
            icon={<Heart size={18} />} tone="pink" title="Blood Bank"
            onClick={() => showToast('Coming soon', 'info')}
          />
          <ActionTile
            icon={<Activity size={18} />} tone="mint" title="Progress"
            onClick={() => navigate('/app/progress')}
          />
        </div>
      </section>

      {/* Recently logged */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">Recent Activity</h3>
          {todayMeals.length > 0 && (
            <button onClick={() => navigate('/app/log')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-dark)', fontWeight: 600, fontSize: 14 }}>
              See all
            </button>
          )}
        </div>
        {todayMeals.length === 0 ? (
          <div className="card text-center" style={{ padding: '24px 16px' }}>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No meals logged yet today.
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Tap the + button below to log your first meal.
            </div>
          </div>
        ) : (
          todayMeals.map(m => (
            <div key={m.id} className="card flex items-center gap-3" style={{ padding: '12px 14px' }}>
              <div className="icon-bubble tile-mint" style={{ width: 36, height: 36 }}>
                <span style={{ fontSize: 16 }}>🍽️</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-sm font-semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(m.calories)} kcal · {formatTime(m.date)}
                </div>
              </div>
              <button
                aria-label="Delete meal"
                onClick={() => { removeMeal(m.id); showToast('Meal removed'); }}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: 8, borderRadius: 8,
                }}
              >
                <Trash2 size={16} color="var(--text-muted)" />
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

/* ---------------- Sub-components ---------------- */

function Avatar({ user, name }) {
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={name}
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-soft)' }}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="icon-bubble" style={{
      width: 44, height: 44,
      background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
      color: '#fff', fontWeight: 700, fontSize: 16,
    }}>
      {initialsOf(name)}
    </div>
  );
}

function IconBtn({ children, onClick, ariaLabel, tone }) {
  const bg = tone === 'rose' ? 'var(--pastel-pink)' : 'var(--card-bg)';
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: 38, height: 38, borderRadius: '50%',
        background: bg, border: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >{children}</button>
  );
}

function Tile({ className, icon, title, subtitle }) {
  return (
    <div className={`tile ${className}`} style={{ padding: '10px 12px' }}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-bold">{title}</span>
      </div>
      <div className="text-xs" style={{ opacity: 0.75 }}>{subtitle}</div>
    </div>
  );
}

function ScoreRing({ value }) {
  const r = 38, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width={92} height={92} className="ring-svg">
      <circle cx={46} cy={46} r={r} fill="none" stroke="var(--border-color)" strokeWidth={8} />
      <circle
        cx={46} cy={46} r={r} fill="none"
        stroke="var(--primary)" strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={46} y={50}
        textAnchor="middle"
        fontSize="20" fontWeight="700"
        fill="var(--primary-dark)"
        transform="rotate(90 46 46)"
      >{value}</text>
    </svg>
  );
}

function CalorieRing({ consumed, target }) {
  const pct = Math.min(1, consumed / Math.max(1, target));
  const remaining = Math.max(0, target - consumed);
  const r = 48, c = 2 * Math.PI * r;
  const off = c - pct * c;
  return (
    <div style={{ position: 'relative', width: 116, height: 116, flexShrink: 0 }}>
      <svg width={116} height={116} className="ring-svg">
        <circle cx={58} cy={58} r={r} fill="none" stroke="var(--border-color)" strokeWidth={10} />
        <circle
          cx={58} cy={58} r={r} fill="none"
          stroke="var(--primary)" strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div className="text-2xl font-extrabold" style={{ color: 'var(--primary-dark)', lineHeight: 1 }}>
          {Math.round(remaining)}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>kcal left</div>
      </div>
    </div>
  );
}

function MacroBar({ label, used, target, color, bg, unit = 'g' }) {
  const pct = Math.min(100, Math.round(((used || 0) / Math.max(1, target)) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="text-xs font-semibold">{Math.round(used || 0)}{unit} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {Math.round(target)}{unit}</span></span>
      </div>
      <div style={{ height: 6, background: bg, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

function ActionTile({ icon, tone, title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card"
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        padding: '14px',
        background: 'var(--card-bg)',
      }}
    >
      <div className={`icon-bubble tile-${tone}`} style={{ marginBottom: 8 }}>{icon}</div>
      <div className="text-sm font-semibold">{title}</div>
    </button>
  );
}

function scoreLabel(s) {
  if (s >= 85) return { label: 'Excellent', color: 'var(--pastel-mint-fg)' };
  if (s >= 70) return { label: 'Good',      color: 'var(--primary-dark)' };
  if (s >= 50) return { label: 'Fair',      color: 'var(--pastel-amber-fg)' };
  return { label: 'Needs work', color: 'var(--pastel-pink-fg)' };
}
