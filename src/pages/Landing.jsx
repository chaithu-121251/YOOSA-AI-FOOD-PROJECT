import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Camera, Flame, BarChart3, FileText, Target,
  ArrowRight, Leaf, Heart, Zap,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: Camera,    title: 'AI Food Scan',     desc: 'Snap a meal — get calories & macros instantly.', tile: 'tile-mint' },
    { icon: Sparkles,  title: 'Smart Suggestions', desc: 'Personalised meal ideas for what you need next.', tile: 'tile-violet' },
    { icon: Flame,     title: 'Streak Tracker',   desc: 'Stay consistent with daily logging streaks.', tile: 'tile-amber' },
    { icon: BarChart3, title: 'Weekly Reports',   desc: 'AI-generated insights into your week.',  tile: 'tile-blue' },
    { icon: Target,    title: 'Custom Targets',   desc: 'Calories & macros tailored to your goal.', tile: 'tile-rose' },
    { icon: Heart,     title: 'Health Score',     desc: 'A daily score that reflects your wellness.', tile: 'tile-sky' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <section style={{
        padding: '32px 20px 24px',
        background: 'linear-gradient(180deg, var(--primary-tint) 0%, var(--bg-color) 100%)',
      }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="icon-bubble" style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(20,184,166,0.3)',
          }}>
            <Leaf size={20} />
          </div>
          <div className="text-xl font-extrabold" style={{ color: 'var(--primary-dark)' }}>Dhillichythanya</div>
        </div>

        <h1 className="text-4xl font-extrabold mb-3" style={{ lineHeight: 1.1 }}>
          Eat smarter.<br />
          <span style={{ color: 'var(--primary-dark)' }}>Live better.</span>
        </h1>
        <p className="text-base mb-6" style={{ color: 'var(--text-secondary)' }}>
          Your AI-powered nutrition coach. Snap meals, hit your macros, and build healthy habits — one bite at a time.
        </p>

        <button className="btn" onClick={() => navigate('/login')}>
          Get Started <ArrowRight size={18} />
        </button>
        <button className="btn btn-secondary mt-3" onClick={() => navigate('/login')}>
          I already have an account
        </button>

        <div className="flex justify-between mt-8" style={{ opacity: 0.8 }}>
          <Stat number="10K+" label="Foods" />
          <Stat number="< 2s"  label="AI Scan" />
          <Stat number="24/7"  label="Coach" />
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '24px 20px' }}>
        <h2 className="text-xl font-bold mb-1">Everything you need</h2>
        <p className="text-sm mb-4">All your wellness tools in one place.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{ padding: '16px' }}>
              <div className={`icon-bubble ${f.tile}`} style={{ marginBottom: '10px' }}>
                <f.icon size={20} />
              </div>
              <div className="text-sm font-bold mb-1">{f.title}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '8px 20px 24px' }}>
        <h2 className="text-xl font-bold mb-1">How it works</h2>
        <p className="text-sm mb-4">Three steps to better eating.</p>

        <Step n={1} title="Tell us about you" desc="Quick 6-step setup — goals, diet, activity." />
        <Step n={2} title="Snap your meals"  desc="Take a photo. AI identifies and logs the food for you." />
        <Step n={3} title="Get personalised AI guidance" desc="Daily tips, weekly reports, and smart suggestions." />
      </section>

      {/* CTA footer */}
      <section style={{
        padding: '24px 20px 40px',
        marginTop: 'auto',
        background: 'linear-gradient(180deg, transparent 0%, var(--primary-tint) 100%)',
      }}>
        <div className="card text-center" style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          color: '#fff',
          border: 'none',
          padding: '24px 20px',
        }}>
          <div className="flex justify-center mb-3">
            <Zap size={28} />
          </div>
          <div className="text-lg font-bold mb-1" style={{ color: '#fff' }}>Start your wellness journey</div>
          <div className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Free to use. No credit card. Just better habits.
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/login')}
            style={{ background: '#fff', color: 'var(--primary-dark)', border: 'none' }}
          >
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-lg font-extrabold" style={{ color: 'var(--primary-dark)' }}>{number}</div>
      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="card flex items-center gap-3" style={{ padding: '14px' }}>
      <div className="icon-bubble" style={{
        background: 'var(--primary-tint)',
        color: 'var(--primary-dark)',
        fontWeight: 700,
        fontSize: '16px',
      }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc}</div>
      </div>
    </div>
  );
}
