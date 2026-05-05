// Pure calculation helpers — no React, no side effects.

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export function calculateAge(dob) {
  if (!dob) return 25;
  const year = typeof dob === 'object' ? dob.year : null;
  if (!year) return 25;
  return Math.max(1, new Date().getFullYear() - year);
}

export function calculateBMR({ gender, weight, height, age }) {
  // Mifflin-St Jeor
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += gender === 'male' ? 5 : -161;
  return bmr;
}

export function calculateTargets({ gender, weight, height, dob, activityLevel, goal }) {
  const age = calculateAge(dob);
  const bmr = calculateBMR({ gender, weight, height, age });
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2);

  let calories = tdee;
  if (goal === 'lose') calories -= 500;
  if (goal === 'gain') calories += 300;

  calories = Math.round(calories);
  const protein = Math.round((calories * 0.30) / 4);
  const carbs   = Math.round((calories * 0.40) / 4);
  const fats    = Math.round((calories * 0.30) / 9);

  return { calories, protein, carbs, fats };
}

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(bmi) {
  if (bmi == null) return { label: '—', color: 'var(--text-muted)' };
  if (bmi < 18.5) return { label: 'Underweight', color: 'var(--pastel-blue-fg)' };
  if (bmi < 25)   return { label: 'Normal',      color: 'var(--pastel-mint-fg)' };
  if (bmi < 30)   return { label: 'Overweight',  color: 'var(--pastel-amber-fg)' };
  return { label: 'Obese', color: 'var(--pastel-pink-fg)' };
}

export function healthScore({ targets, intake, streak = 0 }) {
  // Simple wellness composite — 0..100.
  if (!targets?.calories) return 50;
  const calRatio = (intake?.calories || 0) / targets.calories;
  // Best when 0.85..1.05 of target
  let calScore;
  if (calRatio === 0) calScore = 60;
  else if (calRatio < 0.6) calScore = 50;
  else if (calRatio <= 1.05) calScore = 95 - Math.abs(0.95 - calRatio) * 100;
  else if (calRatio <= 1.25) calScore = 80 - (calRatio - 1.05) * 200;
  else calScore = 50;

  const proteinRatio = (intake?.protein || 0) / Math.max(1, targets.protein);
  const proteinScore = Math.min(100, proteinRatio * 100);

  const streakScore = Math.min(100, 60 + streak * 5);
  const composite = (calScore * 0.5) + (proteinScore * 0.25) + (streakScore * 0.25);
  return Math.max(0, Math.min(100, Math.round(composite)));
}

/* ---------------- Date helpers ---------------- */

function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------------- Streak ---------------- */

export function calculateStreak(meals = []) {
  if (!meals.length) return 0;
  const days = new Set(meals.map(m => dateKey(m.date)));
  let streak = 0;
  const cursor = new Date();
  // Allow today to be missing — only count if meal logged today, otherwise count back from yesterday.
  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dateKey(cursor))) return 0;
    streak = 1;
  } else {
    streak = 1;
  }
  while (true) {
    cursor.setDate(cursor.getDate() - 1);
    if (days.has(dateKey(cursor))) streak += 1;
    else break;
  }
  return streak;
}

/* ---------------- Daily / weekly aggregation ---------------- */

export function todayIntake(meals = []) {
  const key = todayKey();
  const todays = meals.filter(m => dateKey(m.date) === key);
  return todays.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs:   acc.carbs   + (m.carbs   || 0),
      fats:    acc.fats    + (m.fats    || 0),
      count:   acc.count + 1,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 }
  );
}

export function remainingMacros(targets, intake) {
  return {
    calories: Math.max(0, (targets?.calories || 0) - (intake?.calories || 0)),
    protein:  Math.max(0, (targets?.protein  || 0) - (intake?.protein  || 0)),
    carbs:    Math.max(0, (targets?.carbs    || 0) - (intake?.carbs    || 0)),
    fats:     Math.max(0, (targets?.fats     || 0) - (intake?.fats     || 0)),
  };
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weeklyCalorieData(meals = []) {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const cals = meals
      .filter(m => dateKey(m.date) === key)
      .reduce((s, m) => s + (m.calories || 0), 0);
    result.push({
      day: DAY_LABELS[d.getDay()],
      date: key,
      calories: Math.round(cals),
      isToday: i === 0,
    });
  }
  return result;
}

export function weeklyMacroBreakdown(meals = []) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const todays = meals.filter(m => dateKey(m.date) === key);
    out.push({
      day: DAY_LABELS[d.getDay()],
      date: key,
      protein: Math.round(todays.reduce((s, m) => s + (m.protein || 0), 0)),
      carbs:   Math.round(todays.reduce((s, m) => s + (m.carbs   || 0), 0)),
      fats:    Math.round(todays.reduce((s, m) => s + (m.fats    || 0), 0)),
    });
  }
  return out;
}

export function last7DaysSummary(meals = [], targets = {}) {
  return weeklyCalorieData(meals).map(d => {
    const todays = meals.filter(m => dateKey(m.date) === d.date);
    return {
      date: d.date,
      calories: d.calories,
      protein: Math.round(todays.reduce((s, m) => s + (m.protein || 0), 0)),
      carbs:   Math.round(todays.reduce((s, m) => s + (m.carbs   || 0), 0)),
      fats:    Math.round(todays.reduce((s, m) => s + (m.fats    || 0), 0)),
      target:  targets.calories || 0,
    };
  });
}

/* ---------------- Meal-type bucketing ---------------- */

export function mealTypeFromDate(d) {
  const h = new Date(d).getHours();
  if (h >= 4 && h < 11)  return 'Breakfast';
  if (h >= 11 && h < 15) return 'Lunch';
  if (h >= 17 && h < 22) return 'Dinner';
  return 'Snacks';
}

export function groupMealsByType(meals = []) {
  const groups = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
  meals.forEach(m => {
    const t = mealTypeFromDate(m.date);
    groups[t].push(m);
  });
  return groups;
}

/* ---------------- Misc ---------------- */

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function initialsOf(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join('') || 'U';
}

export function formatTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
