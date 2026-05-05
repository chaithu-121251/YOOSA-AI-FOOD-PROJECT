import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Leaf } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { useAppContext } from '../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, isOnboarded, showToast } = useAppContext();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const goNext = () => navigate(isOnboarded ? '/app' : '/onboarding');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      showToast(`Signed in as ${result.user.email}`, 'success');
      goNext();
    } catch (err) {
      console.error(err);
      const code = err?.code || '';
      let msg = err?.message || 'Failed to sign in.';
      if (code === 'auth/popup-blocked') {
        msg = 'Popup blocked by your browser. Please allow popups for this site.';
      } else if (code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in cancelled.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains.';
      } else if (code === 'auth/network-request-failed') {
        msg = 'Network error. Check your connection and try again.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => navigate('/onboarding');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 16px' }}>
        <Link
          to="/"
          className="flex items-center gap-2 text-sm"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Back
        </Link>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 24px 40px',
      }}>
        <div className="icon-bubble" style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          color: '#fff',
          marginBottom: '16px',
          boxShadow: '0 8px 20px rgba(20,184,166,0.3)',
        }}>
          <Leaf size={28} />
        </div>

        <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--primary-dark)' }}>Dhillichythanya</h1>
        <p className="text-sm mb-8 text-center" style={{ color: 'var(--text-secondary)' }}>
          Wellness and Goodness, by Dhillichythanya
        </p>

        <div className="card w-full" style={{ maxWidth: 400, padding: '24px 20px' }}>
          <h2 className="text-xl font-bold text-center mb-1">Welcome back</h2>
          <p className="text-sm text-center mb-6">Sign in to continue your wellness journey.</p>

          {error && (
            <div className="mb-4" style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: 'var(--error)',
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-secondary"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? <div className="loader loader-sm" /> : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mt-4 mb-4">
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          </div>

          <button className="btn" onClick={handleSkip}>
            Continue without account
          </button>

          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            By continuing you agree to our Terms & Privacy.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 7.1 29.3 5 24 5 16.3 5 9.7 9.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.6 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
