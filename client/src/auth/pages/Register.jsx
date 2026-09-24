import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/axios';
import { validateAuth } from '../../lib/validation';

const FieldError = ({ error }) =>
  error ? <p className="mt-1 text-xs text-red-500 font-medium">{error}</p> : null;

const Register = () => {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  const [values, setValues] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = (name, val, allValues = values) => {
    if (name === 'username') return validateAuth.username(val);
    if (name === 'email') return validateAuth.email(val);
    if (name === 'password') return validateAuth.password(val);
    if (name === 'confirmPassword') return validateAuth.confirmPassword(allValues.password, val);
    return null;
  };

  const handleChange = (name) => (e) => {
    const val = e.target.value;
    setValues(prev => ({ ...prev, [name]: val }));
    if (touched[name]) {
      const newValues = { ...values, [name]: val };
      setErrors(prev => ({ ...prev, [name]: validate(name, val, newValues) }));
    }
  };

  const handleBlur = (name) => () => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validate(name, values[name]) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const allTouched = { username: true, email: true, password: true, confirmPassword: true };
    setTouched(allTouched);
    const newErrors = {
      username: validate('username', values.username),
      email: validate('email', values.email),
      password: validate('password', values.password),
      confirmPassword: validate('confirmPassword', values.confirmPassword),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    isSubmittingRef.current = true;
    setLoading(true);
    setServerError('');
    try {
      const { data } = await apiClient.post('/auth/register', {
        username: values.username,
        email: values.email,
        password: values.password,
      });
      if (data.success) navigate('/');
    } catch (err) {
      const code = err.response?.data?.code;
      if (code === 'USER_EXISTS') setServerError('An account with that email or username already exists.');
      else if (code === 'RATE_LIMITED') setServerError('Too many attempts. Please try again later.');
      else if (code === 'VALIDATION_ERROR') {
        const e = err.response.data.errors;
        setErrors(prev => ({ ...prev, ...Object.fromEntries(Object.entries(e).map(([k,v]) => [k, v[0]])) }));
      } else setServerError('Registration failed. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-white relative font-sans text-slate-800 flex flex-col justify-between"
      style={{
        backgroundImage: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundColor: '#f8fafc'
      }}
    >
      {/* Curved wave line at bottom */}
      <svg className="absolute bottom-0 w-full h-48 text-indigo-100/50 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1440 320">
        <path fill="currentColor" fillOpacity="1" d="M0,192L80,202.7C160,213,320,235,480,229.3C640,224,800,192,960,186.7C1120,181,1280,203,1360,213.3L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
      </svg>

      {/* Top Header */}
      <div className="w-full max-w-7xl mx-auto px-6 pt-6 pb-2 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">BeatMux</h1>
          <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase border border-indigo-200 bg-indigo-50 px-2 py-1 rounded">Collaborative Studio</span>
        </div>
        <div className="hidden sm:flex bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-semibold items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Web Audio API + WebSockets
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 flex-grow">
        
        {/* Left Side: Copy & Features */}
        <div className="w-full lg:w-[55%] max-w-2xl flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full text-xs font-semibold self-start shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            Multi-Track Sequencer & Jam Room
          </div>

          <h2 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Real-Time Collaborative Audio Production
          </h2>

          <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
            Create beats together in real-time. Combine multi-track drum sequencing, custom audio synthesis, and live multi-user room jamming in your browser.
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Multi-Track Drum Sequencer</h4>
                <p className="text-xs text-slate-500 mt-0.5">16-step grid for Kick, Snare, Hi-Hat, Clap, and Synth lead synthesis.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Real-Time BPM Sync</h4>
                <p className="text-xs text-slate-500 mt-0.5">Node.js WebSocket timing engine keeps all connected users strictly in tempo.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Audio Sample Synthesis</h4>
                <p className="text-xs text-slate-500 mt-0.5">Pure Web Audio API synthesis generating drum samples and analog basslines.</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Multi-User Room Jamming</h4>
                <p className="text-xs text-slate-500 mt-0.5">Join virtual jam rooms, trigger patterns simultaneously, and compose together.</p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Side: Register Card */}
        <div className="w-full lg:w-[40%] max-w-md">
          <div className="bg-white rounded-[24px] shadow-xl shadow-indigo-900/5 border border-slate-100 overflow-hidden relative">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>
            
            <div className="p-8 pb-10">
              <h3 className="text-2xl font-bold text-slate-900">Studio Registration</h3>
              <p className="text-sm text-slate-500 mt-1 mb-6">Create your account and start jamming</p>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1">USERNAME</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input
                      type="text"
                      value={values.username}
                      onChange={handleChange('username')}
                      onBlur={handleBlur('username')}
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border outline-none transition-all text-slate-800 text-sm ${
                        errors.username && touched.username
                          ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
                      }`}
                      placeholder="producer123"
                      autoComplete="username"
                    />
                  </div>
                  <FieldError error={touched.username && errors.username} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1">STUDIO EMAIL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <input
                      type="email"
                      value={values.email}
                      onChange={handleChange('email')}
                      onBlur={handleBlur('email')}
                      className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border outline-none transition-all text-slate-800 text-sm ${
                        errors.email && touched.email
                          ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
                      }`}
                      placeholder="producer@beatmux.com"
                      autoComplete="email"
                    />
                  </div>
                  <FieldError error={touched.email && errors.email} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1">PASSWORD</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input
                      type="password"
                      value={values.password}
                      onChange={handleChange('password')}
                      onBlur={handleBlur('password')}
                      className={`w-full pl-11 pr-11 py-2.5 rounded-xl bg-white border outline-none transition-all text-slate-800 text-sm ${
                        errors.password && touched.password
                          ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
                      }`}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <FieldError error={touched.password && errors.password} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 tracking-wider mb-1">CONFIRM PASSWORD</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <input
                      type="password"
                      value={values.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      onBlur={handleBlur('confirmPassword')}
                      className={`w-full pl-11 pr-11 py-2.5 rounded-xl bg-white border outline-none transition-all text-slate-800 text-sm ${
                        errors.confirmPassword && touched.confirmPassword
                          ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                          : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50'
                      }`}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                  <FieldError error={touched.confirmPassword && errors.confirmPassword} />
                </div>

                {serverError && (
                  <div className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl border border-red-100 font-medium">
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                  {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>}
                </button>
              </form>

              <div className="mt-6 text-center">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <Link to="/" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200/60 relative z-10 text-[11px] text-slate-400 font-medium tracking-wide">
        <p>© 2026 BeatMux Studio Inc. Real-Time Audio Production & Sequencer.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-600">Sequencer Docs</a>
          <a href="#" className="hover:text-slate-600">Web Audio API Engine</a>
          <a href="#" className="hover:text-slate-600">WebSocket Sync API</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
