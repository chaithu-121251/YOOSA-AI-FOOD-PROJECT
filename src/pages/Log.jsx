import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { groupMealsByType, formatTime } from '../utils/calculations';

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const MEAL_ICONS = {
  Breakfast: { Icon: Coffee, tone: 'amber' },
  Lunch:     { Icon: Sun,    tone: 'mint' },
  Dinner:    { Icon: Moon,   tone: 'violet' },
  Snacks:    { Icon: Cookie, tone: 'pink' },
};

function dateKey(d) { return new Date(d).toISOString().slice(0, 10); }
function shiftDate(d, days) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export default function Log() {
  const { meals, removeMeal, showToast } = useAppContext();
  const [viewDate, setViewDate] = useState(new Date());
  const [expanded, setExpanded] = useState({});

  const dayKey = dateKey(viewDate);
  const todayKey = dateKey(new Date());
  const isToday = dayKey === todayKey;
  const isFuture = viewDate > new Date();

  const dayMeals = useMemo(
    () => meals.filter(m => m.date && m.date.slice(0, 10) === dayKey),
    [meals, dayKey]
  );
  const groups = useMemo(() => groupMealsByType(dayMeals), [dayMeals]);

  const total = dayMeals.reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein:  acc.protein  + (m.protein  || 0),
    carbs:    acc.carbs    + (m.carbs    || 0),
    fats:     acc.fats     + (m.fats     || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const heading = isToday
    ? 'Today'
    : viewDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="container fade-in">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold mb-1">Food Log</h1>
        <p className="text-sm">All your meals, grouped by time of day.</p>
      </header>

      {/* Date picker */}
      <div className="card flex items-center justify-between mb-4" style={{ padding: '10px 14px' }}>
        <button
          aria-label="Previous day"
          onClick={() => setViewDate(d => shiftDate(d, -1))}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6 }}
        >
          <ChevronLeft size={20} color="var(--text-secondary)" />
        </button>
        <div className="text-center">
          <div className="text-sm font-bold">{heading}</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {viewDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <button
          aria-label="Next day"
          onClick={() => setViewDate(d => shiftDate(d, 1))}
          disabled={isToday || isFuture}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, opacity: isToday ? 0.3 : 1 }}
        >
          <ChevronRight size={20} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Daily totals */}
      <div className="card mb-4" style={{ background: 'var(--primary-tint)', borderColor: 'var(--primary-soft)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold" style={{ color: 'var(--primary-dark)' }}>Daily Total</div>
          <div className="text-base font-extrabold" style={{ color: 'var(--primary-dark)' }}>
            {Math.round(total.calories)} kcal
          </div>
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span>P: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(total.protein)}g</strong></span>
          <span>C: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(total.carbs)}g</strong></span>
          <span>F: <strong style={{ color: 'var(--text-primary)' }}>{Math.round(total.fats)}g</strong></span>
          <span>{dayMeals.length} item{dayMeals.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Meal groups */}
      {dayMeals.length === 0 ? (
        <div className="card text-center" style={{ padding: '32px 16px' }}>
          <div className="text-base font-semibold mb-1">No meals logged</div>
          <p className="text-sm">Tap the + button to add a meal for this day.</p>
        </div>
      ) : (
        MEAL_ORDER.map(type => {
          const items = groups[type] || [];
          if (!items.length) return null;
          const { Icon, tone } = MEAL_ICONS[type];
          const groupCals = items.reduce((s, m) => s + (m.calories || 0), 0);
          return (
            <section key={type} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`icon-bubble tile-${tone}`} style={{ width: 28, height: 28 }}>
                    <Icon size={14} />
                  </div>
                  <div className="text-sm font-bold">{type}</div>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(groupCals)} kcal
                </div>
              </div>
              {items.map(m => (
                <div key={m.id} className="card" style={{ padding: '12px 14px' }}>
                  <button
                    onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))}
                    style={{
                      background: 'transparent', border: 'none',
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="text-sm font-semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {Math.round(m.calories || 0)} kcal · {formatTime(m.date)}
                        </div>
                      </div>
                      <div
                        role="button"
                        aria-label="Delete meal"
                        onClick={(e) => { e.stopPropagation(); removeMeal(m.id); showToast('Meal removed'); }}
                        style={{ padding: 8, cursor: 'pointer' }}
                      >
                        <Trash2 size={16} color="var(--text-muted)" />
                      </div>
                    </div>
                  </button>
                  {expanded[m.id] && (
                    <div className="mt-3 flex justify-between text-xs" style={{ color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                      <Macro label="Protein" value={`${Math.round(m.protein || 0)}g`} />
                      <Macro label="Carbs"   value={`${Math.round(m.carbs   || 0)}g`} />
                      <Macro label="Fats"    value={`${Math.round(m.fats    || 0)}g`} />
                    </div>
                  )}
                </div>
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}

function Macro({ label, value }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}
