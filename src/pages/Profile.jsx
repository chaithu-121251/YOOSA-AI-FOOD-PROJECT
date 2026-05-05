import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, RefreshCcw, Moon, Sun, Bell, Ruler, Pencil, Check, X,
  Mail, Cake, Target, Salad,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth, signOut } from '../firebase';
import { calculateAge, calculateBMI, bmiCategory, initialsOf } from '../utils/calculations';

export default function Profile() {
  const navigate = useNavigate();
  const {
    user, userData, updateUserData, resetData,
    darkMode, toggleDarkMode,
    unitSystem, toggleUnits,
    showToast,
  } = useAppContext();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: user?.displayName || '',
    height: userData?.height || 170,
    weight: userData?.weight || 70,
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const [notifs, setNotifs] = useState(true);

  const age = calculateAge(userData?.dob);
  const bmi = calculateBMI(userData?.weight, userData?.height);
  const bmiCat = bmiCategory(bmi);

  const displayName =
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Dhillichythanya User';

  const saveEdit = () => {
    updateUserData({
      height: Number(draft.height) || userData?.height,
      weight: Number(draft.weight) || userData?.weight,
    });
    showToast('Profile updated', 'success');
    setEditing(false);
  };

  const handleLogout = async () => {
    try {
      if (user) await signOut(auth);
    } catch {/* ignore */}
    resetData();
    showToast('Signed out', 'success');
    navigate('/');
  };

  const handleReset = () => {
    resetData();
    if (user) signOut(auth).catch(() => {});
    showToast('App reset', 'success');
    navigate('/');
  };

  return (
    <div className="container fade-in">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold mb-1">Profile</h1>
        <p className="text-sm">Manage your account and preferences.</p>
      </header>

      {/* User card */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="icon-bubble" style={{
              width: 64, height: 64,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: '#fff', fontWeight: 700, fontSize: 22,
            }}>
              {initialsOf(displayName)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-lg font-bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Mail size={12} /> {user?.email || 'Guest mode'}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
          {userData?.goal && <span className="chip"><Target size={12} /> {goalLabel(userData.goal)}</span>}
          {userData?.diet && <span className="chip"><Salad size={12} /> {userData.diet}</span>}
          <span className="chip chip-secondary"><Cake size={12} /> {age} yrs</span>
        </div>
      </div>

      {/* Health stats */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Health stats</div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-dark)', fontWeight: 600, fontSize: 13 }}
            >
              <Pencil size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Edit
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => setEditing(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
              <button
                onClick={saveEdit}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-dark)' }}
              >
                <Check size={18} />
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <Stat label="Height" value={`${userData?.height || '—'} cm`} tone="blue" />
            <Stat label="Weight" value={`${userData?.weight || '—'} kg`} tone="mint" />
            <Stat label="BMI"    value={bmi ? bmi.toFixed(1) : '—'} sub={bmiCat.label} tone="violet" />
          </div>
        ) : (
          <div className="flex gap-2">
            <Field label="Height (cm)" flex>
              <input
                type="number"
                className="input"
                value={draft.height}
                onChange={(e) => setDraft(d => ({ ...d, height: e.target.value }))}
              />
            </Field>
            <Field label="Weight (kg)" flex>
              <input
                type="number"
                className="input"
                value={draft.weight}
                onChange={(e) => setDraft(d => ({ ...d, weight: e.target.value }))}
              />
            </Field>
          </div>
        )}
      </div>

      {/* Macro targets */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Daily targets</div>
          <button
            onClick={() => navigate('/onboarding')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary-dark)', fontWeight: 600, fontSize: 13 }}
          >
            <RefreshCcw size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Recalculate
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          <Stat label="kcal"    value={userData?.targets?.calories || '—'} tone="amber" big />
          <Stat label="Protein" value={`${userData?.targets?.protein || '—'}g`} tone="violet" />
          <Stat label="Carbs"   value={`${userData?.targets?.carbs   || '—'}g`} tone="amber" />
          <Stat label="Fats"    value={`${userData?.targets?.fats    || '—'}g`} tone="pink" />
        </div>
      </div>

      {/* Settings */}
      <div className="card mb-4">
        <div className="text-sm font-semibold mb-3">Settings</div>

        <SettingRow
          icon={darkMode ? <Moon size={16} /> : <Sun size={16} />}
          tone={darkMode ? 'violet' : 'amber'}
          label="Dark mode"
          value={darkMode}
          onChange={toggleDarkMode}
        />
        <SettingRow
          icon={<Ruler size={16} />}
          tone="blue"
          label="Units"
          rightLabel={unitSystem === 'metric' ? 'Metric (kg/cm)' : 'Imperial (lb/in)'}
          onClick={() => { toggleUnits(); showToast(`Units: ${unitSystem === 'metric' ? 'imperial' : 'metric'}`, 'info'); }}
        />
        <SettingRow
          icon={<Bell size={16} />}
          tone="mint"
          label="Notifications"
          value={notifs}
          onChange={() => setNotifs(n => !n)}
        />
      </div>

      {/* Actions */}
      <button
        className="btn btn-secondary mb-3"
        onClick={handleLogout}
      >
        <LogOut size={16} /> Sign out
      </button>

      <button
        onClick={() => setConfirmReset(true)}
        className="btn btn-secondary"
        style={{ color: 'var(--error)', borderColor: 'rgba(239,68,68,0.3)' }}
      >
        Reset all data
      </button>

      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Reset everything?</h3>
            <p className="text-sm mb-4">This will delete your profile, meals, weight log, and AI insights. You'll be returned to the start screen. This cannot be undone.</p>
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button
                className="btn"
                onClick={handleReset}
                style={{ background: 'var(--error)' }}
              >
                Yes, reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone, big }) {
  return (
    <div className={`tile tile-${tone}`} style={{ padding: '10px 8px', textAlign: 'center' }}>
      <div className={big ? 'text-lg font-extrabold' : 'text-base font-bold'}>{value}</div>
      <div className="text-xs" style={{ opacity: 0.85 }}>{label}</div>
      {sub && <div className="text-xs" style={{ opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

function Field({ label, children, flex }) {
  return (
    <div style={{ flex: flex ? 1 : undefined }}>
      <label className="text-xs font-medium" style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

function SettingRow({ icon, tone, label, value, onChange, onClick, rightLabel }) {
  const isToggle = onChange !== undefined;
  return (
    <button
      onClick={isToggle ? onChange : onClick}
      className="flex items-center gap-3 w-full"
      style={{
        background: 'transparent',
        border: 'none',
        padding: '10px 0',
        cursor: 'pointer',
        textAlign: 'left',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div className={`icon-bubble tile-${tone}`} style={{ width: 32, height: 32 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="text-sm font-semibold">{label}</div>
      </div>
      {isToggle ? (
        <Switch on={!!value} />
      ) : (
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{rightLabel}</span>
      )}
    </button>
  );
}

function Switch({ on }) {
  return (
    <span
      aria-hidden
      style={{
        width: 36, height: 20,
        borderRadius: 999,
        background: on ? 'var(--primary)' : 'var(--border-color)',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2, left: on ? 18 : 2,
          width: 16, height: 16,
          background: '#fff',
          borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      />
    </span>
  );
}

function goalLabel(g) {
  switch (g) {
    case 'lose':     return 'Lose weight';
    case 'gain':     return 'Gain muscle';
    case 'maintain': return 'Maintain';
    case 'health':   return 'Improve health';
    default: return g;
  }
}
