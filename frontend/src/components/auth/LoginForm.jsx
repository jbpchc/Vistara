import { useState } from 'react';
import { Eye, EyeOff, Loader2, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { IS_DEMO } from '@/api/axios';
import { DEMO_ACCOUNTS } from '@/api/demo';

const ROLE_REDIRECT = {
  admin:    '/admin/dashboard',
  guard:    '/guard/dashboard',
  resident: '/resident/dashboard',
};

const LoginForm = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [form, setForm]             = useState({ username: '', password: '' });
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    setError('');
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.username.trim(), form.password);
      // Always direct them strictly to their role's home page to prevent confusion
      navigate(ROLE_REDIRECT[user.role] || '/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas">

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex-1 flex">

        {/* Left — Logo panel */}
        <div className="hidden md:flex w-1/2 flex-col items-start justify-between bg-brand-forest p-14">
          <img src={`${import.meta.env.BASE_URL}camella-naga-logo-reversed.svg`} alt="Camella Naga" className="w-56 select-none" draggable={false} />
          <div>
            <p className="text-[13px] font-bold tracking-[0.12em] text-side-text">VISTARA</p>
            <p className="mt-2 text-[40px] leading-tight font-semibold text-side-active max-w-md">Gate, visitor and community management for Camella Homes Naga.</p>
            <p className="mt-4 text-[16px] text-side-text max-w-md">One sign-in for the HOA office, homeowners and gate guards.</p>
          </div>
          <p className="text-[13px] text-side-text/80">© 2026 Vistara · Camella Homes Naga</p>
        </div>

        {/* Right — Form panel */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-8 md:px-16 py-12 bg-surface-canvas">
          <div className="w-full max-w-sm anim-fade-in">

            {/* Mobile logo */}
            <div className="flex justify-center mb-8 md:hidden">
              <img src={`${import.meta.env.BASE_URL}camella-naga-logo.svg`} alt="Camella Naga" className="w-48" />
            </div>

            <h1 className="text-[40px] font-semibold text-ink mb-1">Welcome back</h1>
            <p className="text-[16px] text-ink-muted mb-8">Sign in to continue to Vistara.</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-[14px] font-semibold text-ink mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full h-12 px-4 border border-input rounded-xl text-[15px] text-ink bg-surface-card placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[14px] font-semibold text-ink mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full h-12 px-4 pr-12 border border-input rounded-xl text-[15px] text-ink bg-surface-card focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-ink-muted hover:text-ink"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="text-right -mt-1">
                <button 
                  type="button" 
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[14px] font-semibold text-brand hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div role="alert" className="text-[14px] font-semibold text-status-danger bg-status-danger-bg rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full text-[16px] font-semibold text-brand-on bg-brand hover:bg-brand/90 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 spin" /> Signing in…</>
                  : 'Sign in'
                }
              </button>
            </form>

            {(IS_DEMO || import.meta.env.VITE_QUICK_LOGIN === 'true') && (
              <div className="mt-8 rounded-2xl border border-line bg-surface-subtle p-4">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-muted">{IS_DEMO ? 'Demo — sample data' : 'Demo accounts'}</p>
                <p className="mt-1 text-[14px] text-ink-muted">{IS_DEMO ? 'Pick a role to explore. Sample data resets when you reload.' : 'Pick a role to sign in with a test account (password Password@123).'}</p>
                <div className="mt-3 grid gap-2">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button
                      key={a.username}
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setError('');
                        setLoading(true);
                        try {
                          const u = await login(a.username, 'Password@123');
                          navigate(ROLE_REDIRECT[u.role] || '/login', { replace: true });
                        } catch (err) {
                          setError(err.response?.data?.message || 'Demo login failed.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="flex items-center justify-between h-12 px-4 rounded-full bg-surface-card border border-line text-left hover:border-brand transition-colors disabled:opacity-60"
                    >
                      <span className="text-[15px] font-bold text-ink">Continue as {a.role}</span>
                      <span className="text-[13px] text-ink-muted">{a.note}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Immersive Dialog Popup for Forgot Password */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm anim-fade-in animate-duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col p-6 border border-gray-100 text-center space-y-4">
            {/* Support Icon */}
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-800 flex items-center justify-center mx-auto shadow-inner">
              <HelpCircle className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-gray-800 text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Account Recovery Support
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Please proceed to the <span className="font-semibold text-green-800">HOA Staff</span> or <span className="font-semibold text-green-800">Association Office</span> at the clubhouse for account recovery and customer support services.
              </p>
            </div>

            <button
              onClick={() => setIsForgotOpen(false)}
              className="w-full h-10 bg-green-800 hover:bg-green-900 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
