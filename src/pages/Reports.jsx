import { useRef, useState } from 'react';
import { Upload, CheckCircle, FileText, Type, Sparkles } from 'lucide-react';
import { analyzeHealthReport, transcribeReportImage } from '../services/ai';
import { useAppContext } from '../context/AppContext';

export default function Reports() {
  const { userData, updateTargets, showToast } = useAppContext();
  const fileRef = useRef(null);

  const [mode, setMode] = useState('upload'); // 'upload' | 'paste'
  const [stage, setStage] = useState('idle'); // 'idle' | 'transcribing' | 'analyzing' | 'done'
  const [extractedText, setExtractedText] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);

  const reset = () => {
    setStage('idle');
    setExtractedText('');
    setPastedText('');
    setImagePreview(null);
    setResult(null);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image of your report (JPG/PNG).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      setImagePreview(base64);
      setStage('transcribing');
      try {
        const text = await transcribeReportImage(base64);
        setExtractedText(text);
        setStage('analyzing');
        const r = await analyzeHealthReport(text);
        setResult(r);
        setStage('done');
      } catch (err) {
        console.error(err);
        showToast('Could not analyze the report. Try pasting text instead.', 'error');
        setStage('idle');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePastedAnalyze = async () => {
    if (!pastedText.trim()) return;
    setStage('analyzing');
    try {
      const r = await analyzeHealthReport(pastedText);
      setResult(r);
      setExtractedText(pastedText);
      setStage('done');
    } catch (err) {
      console.error(err);
      showToast('Could not analyze the text. Try again.', 'error');
      setStage('idle');
    }
  };

  const applyAdvice = () => {
    const adj = result?.calorieAdjustment || 0;
    const current = userData?.targets?.calories || 2000;
    const next = Math.max(1000, current + adj);
    const protein = Math.round((next * 0.30) / 4);
    const carbs   = Math.round((next * 0.40) / 4);
    const fats    = Math.round((next * 0.30) / 9);
    updateTargets({ calories: next, protein, carbs, fats });
    showToast(`Targets updated to ${next} kcal/day`, 'success');
  };

  return (
    <div className="container fade-in">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold mb-1">Health Reports</h1>
        <p className="text-sm">Upload medical reports for AI-powered dietary insights.</p>
      </header>

      {/* Mode tabs */}
      {stage === 'idle' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('upload')}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 'var(--radius-pill)',
              background: mode === 'upload' ? 'var(--primary)' : 'var(--card-bg)',
              color: mode === 'upload' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Upload size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Upload image
          </button>
          <button
            onClick={() => setMode('paste')}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 'var(--radius-pill)',
              background: mode === 'paste' ? 'var(--primary)' : 'var(--card-bg)',
              color: mode === 'paste' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Type size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Paste text
          </button>
        </div>
      )}

      {stage === 'idle' && mode === 'upload' && (
        <div
          className="card text-center"
          style={{
            padding: '36px 20px',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: 'var(--primary)',
            cursor: 'pointer',
            background: 'var(--primary-tint)',
          }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Upload size={36} color="var(--primary-dark)" style={{ marginBottom: 12 }} />
          <div className="text-base font-bold mb-1">Tap to upload</div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>JPG or PNG of your report</div>
        </div>
      )}

      {stage === 'idle' && mode === 'paste' && (
        <div className="card">
          <label className="text-sm font-medium mb-2" style={{ display: 'block' }}>Paste report text</label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="input"
            rows={7}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Paste lab values, doctor notes, or any health report text here…"
          />
          <button
            className="btn mt-3"
            onClick={handlePastedAnalyze}
            disabled={!pastedText.trim()}
          >
            <Sparkles size={16} /> Analyze
          </button>
        </div>
      )}

      {(stage === 'transcribing' || stage === 'analyzing') && (
        <div className="card text-center">
          <div className="loader mb-4" />
          <div className="text-base font-semibold mb-1">
            {stage === 'transcribing' ? 'Reading your report…' : 'AI is analyzing…'}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            This usually takes a few seconds.
          </div>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Report preview"
              style={{ width: '100%', borderRadius: 'var(--radius-md)', marginTop: 16, maxHeight: 200, objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      {stage === 'done' && result && (
        <>
          <div className="card mb-4" style={{ borderColor: 'var(--primary)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={20} color="var(--primary)" />
              <h3 className="text-base font-bold">AI Analysis Complete</h3>
            </div>

            {result.bullets?.length > 0 ? (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {result.bullets.map((b, i) => (
                  <li key={i} className="text-sm" style={{ marginBottom: 6 }}>{b}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">{result.dietNote || 'No specific recommendations.'}</p>
            )}

            {typeof result.calorieAdjustment === 'number' && result.calorieAdjustment !== 0 && (
              <div className="mt-4" style={{
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-tint)',
                border: '1px solid var(--primary-soft)',
              }}>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Suggested calorie adjustment</div>
                <div className="text-lg font-extrabold" style={{ color: 'var(--primary-dark)' }}>
                  {result.calorieAdjustment > 0 ? '+' : ''}{result.calorieAdjustment} kcal / day
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button className="btn btn-secondary btn-sm" onClick={reset} style={{ width: 'auto', flex: 1 }}>
                <Upload size={14} /> New report
              </button>
              <button className="btn btn-sm" onClick={applyAdvice} style={{ width: 'auto', flex: 2 }}>
                Apply to my targets
              </button>
            </div>
          </div>

          {extractedText && (
            <details className="card" style={{ padding: '12px 14px' }}>
              <summary className="text-xs font-semibold" style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <FileText size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                View extracted text
              </summary>
              <div className="text-xs mt-2" style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', maxHeight: 200, overflow: 'auto' }}>
                {extractedText}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
