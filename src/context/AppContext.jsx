import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const AppContext = createContext();

const LS = {
  userData: 'dhillichythanya_userData',
  meals: 'dhillichythanya_meals',
  weights: 'dhillichythanya_weights',
  insight: 'dhillichythanya_insight',
  theme: 'dhillichythanya_theme',
  units: 'dhillichythanya_units',
  toasts: 'dhillichythanya_toasts',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const [userData, setUserData] = useState(() => readJson(LS.userData, null));
  const [meals, setMeals]       = useState(() => readJson(LS.meals, []));
  const [weights, setWeights]   = useState(() => readJson(LS.weights, []));
  const [dailyInsight, setDailyInsightState] = useState(() => readJson(LS.insight, null));
  const [darkMode, setDarkMode] = useState(() => readJson(LS.theme, false));
  const [unitSystem, setUnitSystem] = useState(() => readJson(LS.units, 'metric'));

  const [toasts, setToasts] = useState([]);

  /* -------- Firebase auth subscription -------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (current) => {
      setUser(current);
      setLoadingAuth(false);
    });
    return unsub;
  }, []);

  /* -------- Persistence -------- */
  useEffect(() => {
    if (userData) {
      localStorage.setItem(LS.userData, JSON.stringify(userData));
      setIsOnboarded(true);
    } else {
      localStorage.removeItem(LS.userData);
      setIsOnboarded(false);
    }
  }, [userData]);

  useEffect(() => { localStorage.setItem(LS.meals, JSON.stringify(meals)); }, [meals]);
  useEffect(() => { localStorage.setItem(LS.weights, JSON.stringify(weights)); }, [weights]);
  useEffect(() => {
    if (dailyInsight) localStorage.setItem(LS.insight, JSON.stringify(dailyInsight));
    else localStorage.removeItem(LS.insight);
  }, [dailyInsight]);
  useEffect(() => { localStorage.setItem(LS.theme, JSON.stringify(darkMode)); }, [darkMode]);
  useEffect(() => { localStorage.setItem(LS.units, JSON.stringify(unitSystem)); }, [unitSystem]);

  /* -------- Apply theme to <html> -------- */
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }, [darkMode]);

  /* -------- Actions -------- */
  const saveOnboardingData = useCallback((data) => setUserData(data), []);

  const updateUserData = useCallback((patch) => {
    setUserData(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  const updateTargets = useCallback((patch) => {
    setUserData(prev => prev ? { ...prev, targets: { ...prev.targets, ...patch } } : prev);
  }, []);

  const addMeal = useCallback((meal) => {
    setMeals(prev => [
      ...prev,
      { ...meal, id: Date.now().toString(), date: meal?.date || new Date().toISOString() },
    ]);
  }, []);

  const removeMeal = useCallback((id) => {
    setMeals(prev => prev.filter(m => m.id !== id));
  }, []);

  const addWeight = useCallback((weight) => {
    if (typeof weight !== 'number' || weight <= 0) return;
    setWeights(prev => [
      ...prev,
      { id: Date.now().toString(), date: new Date().toISOString(), weight },
    ]);
    setUserData(prev => prev ? { ...prev, weight } : prev);
  }, []);

  const removeWeight = useCallback((id) => {
    setWeights(prev => prev.filter(w => w.id !== id));
  }, []);

  const setDailyInsight = useCallback((text) => {
    setDailyInsightState({
      date: new Date().toISOString().slice(0, 10),
      text,
    });
  }, []);

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);
  const toggleUnits   = useCallback(() => setUnitSystem(u => u === 'metric' ? 'imperial' : 'metric'), []);

  const resetData = useCallback(() => {
    setUserData(null);
    setMeals([]);
    setWeights([]);
    setDailyInsightState(null);
    Object.values(LS).forEach(k => localStorage.removeItem(k));
  }, []);

  /* -------- Toasts -------- */
  const showToast = useCallback((message, kind = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <AppContext.Provider value={{
      user, setUser, loadingAuth,
      isOnboarded, userData, saveOnboardingData, updateUserData, updateTargets,
      meals, addMeal, removeMeal,
      weights, addWeight, removeWeight,
      dailyInsight, setDailyInsight,
      darkMode, toggleDarkMode,
      unitSystem, toggleUnits,
      toasts, showToast,
      resetData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
