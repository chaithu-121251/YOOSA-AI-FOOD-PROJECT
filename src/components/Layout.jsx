import { useRef, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home, FileText, Sparkles, BarChart3, User,
  Plus, X, Camera, Image as ImageIcon, Pencil, Type,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { analyzeFoodImage, estimateMealFromText } from '../services/ai';

export default function Layout() {
  const { addMeal, showToast } = useAppContext();
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState('photo');
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [editing, setEditing] = useState(false);
  const [textQuery, setTextQuery] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const reset = () => {
    setTab('photo');
    setImagePreview(null);
    setResult(null);
    setEditing(false);
    setAnalyzing(false);
    setTextQuery('');
    setTextLoading(false);
  };

  const closeModal = () => {
    setShowAdd(false);
    setTimeout(reset, 200);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setImagePreview(base64);
      setAnalyzing(true);
      setResult(null);
      try {
        const r = await analyzeFoodImage(base64);
        setResult({
          name: r.name || 'Food item',
          calories: Math.round(r.calories || 0),
          protein: Math.round(r.protein || 0),
          carbs: Math.round(r.carbs || 0),
          fats: Math.round(r.fats || 0),
          serving_size: r.serving_size || '1 serving',
          confidence_percent: r.confidence_percent || null,
        });
      } catch (err) {
        console.error(err);
        showToast('Could not analyze the photo. Try again or log manually.', 'error');
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = async () => {
    if (!textQuery.trim()) return;
    setTextLoading(true);
    setResult(null);
    try {
      const r = await estimateMealFromText(textQuery);
      setResult({
        name: r.name || textQuery,
        calories: Math.round(r.calories || 0),
        protein: Math.round(r.protein || 0),
        carbs: Math.round(r.carbs || 0),
        fats: Math.round(r.fats || 0),
        serving_size: r.serving_size || '1 serving',
        confidence_percent: r.confidence_percent || null,
      });
    } catch (err) {
      console.error(err);
      showToast('Could not estimate. Try a different description.', 'error');
    } finally {
      setTextLoading(false);
    }
  };

  const confirmLog = () => {
    if (!result) return;
    addMeal({
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
    });
    showToast(`${result.name} logged`, 'success');
    closeModal();
  };

  return (
    <>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAdd(true)} aria-label="Log food">
        <Plus className="fab-icon" />
      </button>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <NavLink end to="/app" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={22} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/app/log" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={22} />
          <span>Log</span>
        </NavLink>
        <div style={{ width: 60 }} />
        <NavLink to="/app/progress" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={22} />
          <span>Progress</span>
        </NavLink>
        <NavLink to="/app/ai" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Sparkles size={22} />
          <span>AI</span>
        </NavLink>
        <NavLink to="/app/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={22} />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Add modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Log Meal</h3>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={22} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Tabs */}
            {!result && !analyzing && !textLoading && !imagePreview && (
              <>
                <div className="flex gap-2 mb-4">
                  <TabBtn active={tab === 'photo'} onClick={() => setTab('photo')}>📸 Photo</TabBtn>
                  <TabBtn active={tab === 'text'}  onClick={() => setTab('text')}>✍️ Text</TabBtn>
                </div>

                {tab === 'photo' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button
                      className="card selectable-card"
                      onClick={() => cameraRef.current?.click()}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 130, gap: 10, cursor: 'pointer' }}
                    >
                      <div className="icon-bubble tile-mint"><Camera size={20} /></div>
                      <span className="text-sm font-semibold">Take Photo</span>
                    </button>
                    <button
                      className="card selectable-card"
                      onClick={() => galleryRef.current?.click()}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 130, gap: 10, cursor: 'pointer' }}
                    >
                      <div className="icon-bubble tile-violet"><ImageIcon size={20} /></div>
                      <span className="text-sm font-semibold">Upload Photo</span>
                    </button>
                  </div>
                )}

                {tab === 'text' && (
                  <div>
                    <label className="text-sm font-medium mb-2" style={{ display: 'block' }}>What did you eat?</label>
                    <input
                      className="input"
                      placeholder="e.g. 2 scrambled eggs and a slice of toast"
                      value={textQuery}
                      onChange={(e) => setTextQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); }}
                      autoFocus
                    />
                    <button
                      className="btn mt-3"
                      onClick={handleTextSubmit}
                      disabled={!textQuery.trim()}
                    >
                      <Type size={16} /> Estimate macros
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Image preview while analyzing or with result */}
            {imagePreview && (
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 16, maxHeight: 220, background: 'var(--bg-color)' }}>
                <img src={imagePreview} alt="Captured food" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', maxHeight: 220 }} />
              </div>
            )}

            {(analyzing || textLoading) && (
              <div className="card" style={{ padding: 16 }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="loader loader-sm" />
                  <div className="text-sm font-semibold">Analyzing with AI…</div>
                </div>
                <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '85%' }} />
              </div>
            )}

            {result && !analyzing && !textLoading && (
              <ResultCard
                result={result}
                editing={editing}
                onEdit={() => setEditing(true)}
                onCancelEdit={() => setEditing(false)}
                onUpdate={(patch) => setResult(r => ({ ...r, ...patch }))}
                onConfirm={confirmLog}
                onRetry={reset}
              />
            )}

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFile(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}
    </>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 12px',
        borderRadius: 'var(--radius-pill)',
        background: active ? 'var(--primary)' : 'var(--bg-color)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: 'none',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
      }}
    >{children}</button>
  );
}

function ResultCard({ result, editing, onEdit, onCancelEdit, onUpdate, onConfirm, onRetry }) {
  return (
    <div className="card" style={{ borderColor: 'var(--primary)', background: 'var(--primary-tint)' }}>
      {!editing ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <div className="text-base font-bold">{result.name}</div>
            {result.confidence_percent && (
              <span className="chip">{result.confidence_percent}% confident</span>
            )}
          </div>
          <div className="text-2xl font-extrabold" style={{ color: 'var(--primary-dark)', marginBottom: 4 }}>
            {result.calories} kcal
          </div>
          <div className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{result.serving_size}</div>
          <div className="flex justify-around text-sm" style={{ borderTop: '1px solid var(--primary-soft)', paddingTop: 10 }}>
            <Macro label="Protein" value={`${result.protein}g`} />
            <Macro label="Carbs"   value={`${result.carbs}g`} />
            <Macro label="Fats"    value={`${result.fats}g`} />
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-secondary btn-sm" onClick={onEdit} style={{ width: 'auto', flex: 1 }}>
              <Pencil size={14} /> Edit
            </button>
            <button className="btn btn-sm" onClick={onConfirm} style={{ width: 'auto', flex: 2 }}>
              Log this
            </button>
          </div>
          <button
            onClick={onRetry}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, marginTop: 10, cursor: 'pointer', width: '100%' }}
          >
            Try a different photo / description
          </button>
        </>
      ) : (
        <>
          <div className="text-sm font-semibold mb-3">Edit values</div>
          <Field label="Name">
            <input className="input" value={result.name} onChange={(e) => onUpdate({ name: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <Field label="Calories" flex>
              <input type="number" className="input" value={result.calories} onChange={(e) => onUpdate({ calories: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Protein g" flex>
              <input type="number" className="input" value={result.protein} onChange={(e) => onUpdate({ protein: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Field label="Carbs g" flex>
              <input type="number" className="input" value={result.carbs} onChange={(e) => onUpdate({ carbs: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Fats g" flex>
              <input type="number" className="input" value={result.fats} onChange={(e) => onUpdate({ fats: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-secondary btn-sm" onClick={onCancelEdit} style={{ width: 'auto', flex: 1 }}>Cancel</button>
            <button className="btn btn-sm" onClick={onConfirm} style={{ width: 'auto', flex: 2 }}>Save & Log</button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children, flex }) {
  return (
    <div style={{ marginBottom: 10, flex: flex ? 1 : undefined }}>
      <label className="text-xs font-medium mb-1" style={{ display: 'block', color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  );
}

function Macro({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="text-base font-bold">{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}
