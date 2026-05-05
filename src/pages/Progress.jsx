import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  Flame, Plus, X, Sparkles, Copy, Activity, TrendingUp,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  weeklyCalorieData, weeklyMacroBreakdown, calculateStreak,
  calculateBMI, bmiCategory, last7DaysSummary,
} from '../utils/calculations';
import { groqWeeklyReport } from '../services/groq';

export default function Progress() {
  const { userData, meals, weights, addWeight, showToast } = useAppContext();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const targets = userData?.targets || { calories: 2000, protein: 150, carbs: 200, fats: 65 };

  const weeklyCals = useMemo(() => weeklyCalorieData(meals), [meals]);
  const weeklyMacros = useMemo(() => weeklyMacroBreakdown(meals), [meals]);
  const streak = useMemo(() => calculateStreak(meals), [meals]);
  const bmi = useMemo(
    () => calculateBMI(userData?.weight, userData?.height),
    [userData]
  );
  const bmiCat = useMemo(() => bmiCategory(bmi), [bmi]);

  const weightChartData = useMemo(() => {
    const sorted = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!sorted.length && userData?.weight) {
      // Seed with starting weight
      return [{
        date: new Date(userData?.createdAt || Date.now()).toISOString().slice(5, 10),
        weight: userData.weight,
      }];
    }
    return sorted.map(w => ({
      date: new Date(w.date).toISOString().slice(5, 10),
      weight: w.weight,
    }));
  }, [weights, userData]);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setReport(null);
    try {
      const summary = last7DaysSummary(meals, targets);
      const r = await groqWeeklyReport(userData, summary);
      setReport(r);
      showToast('Weekly report generated', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate report. Please try again.', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const handleCopyReport = async () => {
    if (!report) return;
    const text = `Dhillichythanya Weekly Report\n\n${report.summary}\n\nRecommendations:\n${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Report copied to clipboard', 'success');
    } catch {
      showToast('Could not copy to clipboard', 'error');
    }
  };

  return (
    <div className="container fade-in">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold mb-1">Your Progress</h1>
        <p className="text-sm">A look at your wellness journey.</p>
      </header>

      {/* Streak */}
      <div className="card mb-4 tile-amber" style={{ border: 'none' }}>
        <div className="flex items-center gap-3">
          <div className="icon-bubble" style={{ background: '#fff', color: 'var(--pastel-amber-fg)' }}>
            <Flame size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="text-lg font-extrabold" style={{ color: 'var(--pastel-amber-fg)' }}>
              {streak} day streak
            </div>
            <div className="text-xs" style={{ color: 'var(--pastel-amber-fg)', opacity: 0.85 }}>
              {streak === 0 ? 'Log a meal today to start' : 'Stay consistent — your future self thanks you.'}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly calories */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">Weekly Calories</h3>
          <span className="chip chip-secondary">Target {targets.calories}</span>
        </div>
        <div style={{ height: 200, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyCals} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(20,184,166,0.08)' }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                }}
                formatter={(v) => [`${v} kcal`, 'Calories']}
              />
              <Bar dataKey="calories" fill="var(--primary)" radius={[8, 8, 8, 8]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="card mb-4">
        <h3 className="text-base font-bold mb-3">Macro Breakdown (week)</h3>
        <div style={{ height: 200, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyMacros} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'rgba(20,184,166,0.08)' }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                }}
                formatter={(v, k) => [`${v}g`, k.charAt(0).toUpperCase() + k.slice(1)]}
              />
              <Bar dataKey="protein" stackId="m" fill="var(--pastel-violet-fg)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="carbs"   stackId="m" fill="var(--pastel-amber-fg)"  />
              <Bar dataKey="fats"    stackId="m" fill="var(--pastel-pink-fg)"   radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-3 mt-2 text-xs justify-center">
          <Legend color="var(--pastel-violet-fg)" label="Protein" />
          <Legend color="var(--pastel-amber-fg)"  label="Carbs" />
          <Legend color="var(--pastel-pink-fg)"   label="Fats" />
        </div>
      </div>

      {/* BMI card */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="icon-bubble tile-mint" style={{ width: 32, height: 32 }}>
              <Activity size={16} />
            </div>
            <h3 className="text-base font-bold">Body Mass Index</h3>
          </div>
          <span style={{
            color: bmiCat.color, fontWeight: 700, fontSize: 13,
          }}>{bmiCat.label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold" style={{ color: 'var(--primary-dark)' }}>
            {bmi ? bmi.toFixed(1) : '—'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>kg/m²</span>
        </div>
        <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          {userData?.height || '—'} cm · {userData?.weight || '—'} kg
        </div>
      </div>

      {/* Weight log */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="icon-bubble tile-blue" style={{ width: 32, height: 32 }}>
              <TrendingUp size={16} />
            </div>
            <h3 className="text-base font-bold">Weight Log</h3>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => setShowWeightModal(true)}
            style={{ width: 'auto' }}
          >
            <Plus size={14} /> Log
          </button>
        </div>
        {weightChartData.length < 2 ? (
          <div className="text-sm text-center" style={{ color: 'var(--text-secondary)', padding: '12px 0' }}>
            Log a few weight entries to see your trend.
          </div>
        ) : (
          <div style={{ height: 180, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--primary)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {weights.length > 0 && (
          <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
            Latest: <strong style={{ color: 'var(--text-primary)' }}>{weights[weights.length - 1].weight} kg</strong>
          </div>
        )}
      </div>

      {/* Weekly report */}
      <div className="card mb-4" style={{ background: 'var(--primary-tint)', borderColor: 'var(--primary-soft)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="icon-bubble" style={{ width: 28, height: 28, background: 'var(--primary)', color: '#fff' }}>
            <Sparkles size={14} />
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--primary-dark)' }}>AI Weekly Report</h3>
        </div>
        {report ? (
          <>
            {report.score != null && (
              <div className="mb-2">
                <span className="chip">Week score: {report.score}/100</span>
              </div>
            )}
            <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>{report.summary}</p>
            {report.recommendations?.length > 0 && (
              <ol style={{ paddingLeft: 18, margin: 0 }}>
                {report.recommendations.map((r, i) => (
                  <li key={i} className="text-sm" style={{ marginBottom: 6, color: 'var(--text-primary)' }}>{r}</li>
                ))}
              </ol>
            )}
            <div className="flex gap-2 mt-4">
              <button className="btn btn-secondary btn-sm" onClick={handleCopyReport} style={{ width: 'auto' }}>
                <Copy size={14} /> Copy
              </button>
              <button className="btn btn-sm" onClick={handleGenerateReport} disabled={reportLoading} style={{ width: 'auto' }}>
                {reportLoading ? <div className="loader loader-sm" /> : 'Regenerate'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Get an AI-generated analysis of your last 7 days, with personalised recommendations.
            </p>
            <button
              className="btn"
              onClick={handleGenerateReport}
              disabled={reportLoading}
            >
              {reportLoading ? <div className="loader loader-sm" /> : <><Sparkles size={16} /> Generate weekly report</>}
            </button>
          </>
        )}
      </div>

      {/* Weight modal */}
      {showWeightModal && (
        <WeightModal
          current={userData?.weight || 70}
          onClose={() => setShowWeightModal(false)}
          onSave={(w) => {
            addWeight(w);
            showToast('Weight logged', 'success');
            setShowWeightModal(false);
          }}
        />
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

function WeightModal({ current, onClose, onSave }) {
  const [value, setValue] = useState(current);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Log weight</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={22} color="var(--text-secondary)" />
          </button>
        </div>
        <label className="text-sm font-medium mb-2" style={{ display: 'block' }}>Weight (kg)</label>
        <input
          type="number"
          step="0.1"
          min="20"
          max="400"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input"
          autoFocus
        />
        <button
          className="btn mt-4"
          onClick={() => {
            const num = parseFloat(value);
            if (!isFinite(num) || num <= 0) return;
            onSave(num);
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
