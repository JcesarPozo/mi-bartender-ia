'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useApp } from '@/app/context/AppContext';

interface AuthModalProps {
  onAuthSuccess: () => void;
}

export default function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const { t, tc, isDark, toggleTheme, locale, setLocale } = useApp();
  const a = t.auth;

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setError(''); setSuccessMsg('');
  };

  const switchTab = (t: 'login' | 'register') => { setTab(t); resetForm(); };

  const translateError = (msg: string): string => {
    const e = a.errors;
    if (msg.includes('Invalid login credentials')) return e.invalidCredentials;
    if (msg.includes('Email not confirmed'))        return e.emailNotConfirmed;
    if (msg.includes('User already registered'))    return e.alreadyRegistered;
    if (msg.includes('Password should be'))         return e.weakPassword;
    if (msg.includes('Unable to validate'))         return e.invalidEmail;
    return msg;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(translateError(err.message));
    else onAuthSuccess();
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (password !== confirmPassword) { setError(a.errors.passwordMismatch); return; }
    if (password.length < 6)          { setError(a.errors.passwordTooShort); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setError(translateError(err.message)); }
    else {
      setSuccessMsg(a.accountCreated);
      setTab('login'); setEmail(''); setPassword(''); setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${tc.pageBg}`}>

      {/* Toggles flotantes (tema + idioma) */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tc.btnToggle}`}>
          {locale === 'es' ? '🇬🇧 EN' : '🇪🇸 ES'}
        </button>
        <button onClick={toggleTheme}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tc.btnToggle}`}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce">🍸</div>
          <h1 className={`text-4xl font-bold font-serif ${tc.textTitle} ${tc.titleGlow}`}>
            {t.app.title}
          </h1>
          <p className={`mt-2 ${tc.textTagline}`}>{a.tagline}</p>
        </div>

        {/* Card */}
        <div className={`rounded-2xl shadow-2xl overflow-hidden ${tc.cardBg}`}>

          {/* Tabs */}
          <div className={`flex border-b ${tc.borderDivider}`}>
            {(['login', 'register'] as const).map((tabId) => (
              <button key={tabId} onClick={() => switchTab(tabId)}
                className={`flex-1 py-4 text-sm font-bold transition-all
                  ${tab === tabId
                    ? `${tc.textPrimary} border-b-2 ${isDark ? 'border-[#f5c842] bg-[#f5c842]/10' : 'border-[#8B6914] bg-[#8B6914]/8'}`
                    : `${tc.textFaint} border-b-2 border-transparent hover:${tc.textMuted}`
                  }`}>
                {tabId === 'login' ? a.signIn : a.createAccount}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-8">
            {successMsg && (
              <div className="mb-5 p-4 bg-green-900/30 border border-green-500/40 rounded-xl text-green-400 text-sm">
                ✅ {successMsg}
              </div>
            )}
            {error && (
              <div className={`mb-5 p-4 rounded-xl text-sm border ${tc.errorBox}`}>
                ❌ {error}
              </div>
            )}

            <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-5">
              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${tc.textMuted}`}>{a.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={a.emailPlaceholder} required disabled={loading}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${tc.inputBg}`}
                />
              </div>

              {/* Password */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${tc.textMuted}`}>{a.password}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required disabled={loading}
                  className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${tc.inputBg}`}
                />
              </div>

              {/* Confirm password (solo registro) */}
              {tab === 'register' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${tc.textMuted}`}>{a.confirmPassword}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" required disabled={loading}
                    className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-sm transition-colors ${tc.inputBg}`}
                  />
                </div>
              )}

              <button type="submit" disabled={loading}
                className={`w-full font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-60 text-sm ${tc.btnPrimary}`}>
                {loading
                  ? (tab === 'login' ? a.signingIn : a.creatingAccount)
                  : (tab === 'login' ? a.enterBar   : a.createMyAccount)
                }
              </button>
            </form>

            <p className={`mt-6 text-center text-xs ${tc.textFaint}`}>
              {tab === 'login' ? (
                <>{a.noAccount}{' '}
                  <button onClick={() => switchTab('register')} className={`underline ${tc.textMuted} hover:${tc.textPrimary}`}>
                    {a.signUpFree}
                  </button>
                </>
              ) : (
                <>{a.haveAccount}{' '}
                  <button onClick={() => switchTab('login')} className={`underline ${tc.textMuted} hover:${tc.textPrimary}`}>
                    {a.signInLink}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
