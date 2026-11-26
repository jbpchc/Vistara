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
    <div className="min-h-screen flex flex-col bg-white">

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="flex-1 flex">

        {/* Left — Logo panel */}
        <div className="hidden md:flex w-1/2 items-center justify-center border-r border-gray-200 bg-white">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Camella GuardTrack"
            className="w-72 max-w-xs select-none"
            draggable={false}
          />
        </div>

        {/* Right — Form panel */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-8 md:px-16 bg-white">
          <div className="w-full max-w-sm anim-fade-in">

            {/* Mobile logo */}
            <div className="flex justify-center mb-8 md:hidden">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Camella GuardTrack" className="w-48" />
            </div>

            <h1 className="text-4xl font-bold text-green-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Login
            </h1>
            <p className="text-sm text-gray-500 mb-8">Sign in to continue.</p>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username:
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent disabled:opacity-60 transition-shadow"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password:
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
                    className="w-full h-10 px-3 pr-10 border border-gray-300 rounded-md text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent disabled:opacity-60 transition-shadow"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="text-xs text-green-700 hover:text-green-900 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-md text-sm font-semibold text-white bg-green-800 hover:bg-green-900 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 spin" /> Signing in…</>
                  : 'Login'
                }
              </button>
            </form>

            {IS_DEMO && (
              <div className="mt-8 rounded-2xl border border-line bg-surface-subtle p-4">
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-muted">Demo — no backend</p>
                <p className="mt-1 text-[14px] text-ink-muted">Pick a role to explore. Sample data resets when you reload.</p>
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
                          const u = await login(a.username, 'demo');
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

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2025 Camella Homes. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <button className="hover:text-gray-600 transition-colors">Privacy Policy</button>
            <button className="hover:text-gray-600 transition-colors">Terms of Service</button>
          </div>
        </div>
      </footer>
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
