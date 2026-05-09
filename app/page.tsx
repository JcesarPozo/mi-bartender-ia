'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import MoodSelector from './components/MoodSelector';
import StarRating from './components/StarRating';
import TagFilter from './components/TagFilter';
import ShareCardModal from './components/ShareCardModal';
import DailyDrink from './components/DailyDrink';
import { useApp } from './context/AppContext';
import { buildImagePrompt } from '@/lib/buildImagePrompt';
import { getTagById } from '@/lib/autoTags';
import type { Plan } from '@/lib/plans';
import { getRetryMessage, isResponseBad } from '@/lib/retryMessages';

interface Cocktail {
  id: string;
  name: string;
  recipe: string;
  image_path: string | null;
  created_at: string;
  user_id: string;
  rating: number;
  tags: string[];
}

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as unknown as 'easeOut' } },
  exit:    { opacity: 0, scale: 0.92, transition: { duration: 0.2 } },
};

export default function Home() {
  const { t, tc, isDark, toggleTheme, locale, setLocale } = useApp();
  const app = t.app;

  const [user, setUser]                     = useState<User | null>(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [showAuth, setShowAuth]             = useState(false);   // ← nuevo: controla el modal de login
  const [prompt, setPrompt]                 = useState('');
  const [selectedMood, setSelectedMood]     = useState<string | null>(null);
  const [response, setResponse]             = useState('');
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [cocktailImage, setCocktailImage]   = useState<string | null>(null);
  const [cocktailsList, setCocktailsList]   = useState<Cocktail[]>([]);
  const [shouldSave, setShouldSave]         = useState(true);
  const [imageLoading, setImageLoading]     = useState(false);
  const [imageStatus, setImageStatus]       = useState('');
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [activeCocktailId, setActiveCocktailId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter]     = useState<string | null>(null);
  const [shareTarget, setShareTarget]       = useState<Cocktail | null>(null);
  const [userPlan, setUserPlan]             = useState<Plan>('free');
  const [showPricing, setShowPricing]       = useState(false);
  const [pricingLimitReached, setPricingLimitReached] = useState(false);
  const [upgrading, setUpgrading]           = useState(false);
  const [showProBar, setShowProBar]         = useState(false);
  const [accessToken, setAccessToken]       = useState<string>('');
  const [retryMsg, setRetryMsg]             = useState<string>('');
  const [retryCount, setRetryCount]         = useState(0);
  const retryMsgIndexRef                    = useRef<number | null>(null);

  const moodPromptRef = useRef<string>(''); // prompt interno verboso que se envía a la IA
  const currentReqId         = useRef(0);
  const blobUrlRef           = useRef<string | null>(null);
  const mainPanelRef         = useRef<HTMLDivElement>(null);
  const imageCache           = useRef<Map<string, string>>(new Map());
  const lastImagePromptRef   = useRef('');
  const lastCocktailNameRef  = useRef('');
  const lastRecipeRef        = useRef('');
  const lastImageKeywordsRef = useRef<string | null>(null);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Token expirado o inválido → limpiar sesión solo localmente (sin llamar al servidor)
        supabase.auth.signOut({ scope: 'local' });
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setResponse(''); setCocktailImage(null); setActiveCocktailId(null);
        setPrompt(''); setSelectedMood(null); imageCache.current.clear();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        if (session?.user) setShowAuth(false);
      } else {
        setUser(session?.user ?? null);
      }
    });
    return () => { subscription.unsubscribe(); if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, []);

  useEffect(() => {
    if (user) { loadCocktails(); loadPlan(); imageCache.current.clear(); }
    else setCocktailsList([]);
  }, [user]);

  const loadPlan = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) setAccessToken(session.access_token);
    const { data } = await supabase
      .from('user_subscriptions')
      .select('plan, status')
      .eq('user_id', user!.id)
      .maybeSingle();
    const active = data?.plan === 'premium' && data?.status === 'active';
    setUserPlan(active ? 'premium' : 'free');
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          locale,
          successUrl: `${window.location.origin}/?upgraded=true`,
          cancelUrl: window.location.origin,
        }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setUpgrading(false);
    }
  };

  const handleManagePlan = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ returnUrl: window.location.origin }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('upgraded=true')) {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => loadPlan(), 2000);
    }
  }, []);

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    if (value.trim() === '') {
      setResponse(''); setCocktailImage(null); setActiveCocktailId(null);
      setError(''); setImageStatus(''); setImageLoading(false); setSelectedMood(null);
    }
  };

  const handleMoodSelect = (moodPrompt: string, moodId: string) => {
    if (!moodId) {
      setSelectedMood(null);
      setPrompt('');
      moodPromptRef.current = '';
      setResponse(''); setCocktailImage(null); setActiveCocktailId(null);
      setError(''); setImageStatus(''); setImageLoading(false);
      return;
    }
    // Limpiar siempre el panel al cambiar de ocasión
    setResponse(''); setCocktailImage(null); setActiveCocktailId(null);
    setError(''); setImageStatus(''); setImageLoading(false);
    setSelectedMood(moodId);
    // Input muestra el hint corto (ilustrativo, editable por el usuario)
    const mood = t.app.moods.find(m => m.id === moodId);
    setPrompt(mood?.hint ?? '');
    // El prompt verbose solo va a la IA
    moodPromptRef.current = moodPrompt;
  };

  const persistImage = async (cocktailId: string, src: string | Blob, token: string) => {
    try {
      let publicUrl: string | null = null;
      if (src instanceof Blob) {
        const fileName = `${cocktailId}-${Date.now()}.jpg`;
        const { data: up, error: upErr } = await supabase.storage.from('cocktail-images')
          .upload(fileName, src, { contentType: 'image/jpeg', upsert: true });
        if (upErr) { console.error('[persistImage]', upErr.message); return; }
        publicUrl = supabase.storage.from('cocktail-images').getPublicUrl(up.path).data.publicUrl;
      } else if (!src.startsWith('blob:') && !src.includes('default-cocktail')) {
        publicUrl = src;
      }
      if (!publicUrl) return;
      const { error: uErr } = await supabase.from('cocktails_invented').update({ image_path: publicUrl }).eq('id', cocktailId);
      if (!uErr) setCocktailsList(prev => prev.map(c => c.id === cocktailId ? { ...c, image_path: publicUrl! } : c));
    } catch (e: any) { console.error('[persistImage]', e.message); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setResponse(''); setCocktailImage(null); setActiveCocktailId(null);
    setPrompt(''); setSelectedMood(null); setActiveFilter(null);
    setShowProBar(false); imageCache.current.clear();
  };

  const loadCocktails = async () => {
    if (!user) return;
    const { data } = await supabase.from('cocktails_invented').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setCocktailsList(data as Cocktail[]);
  };

  const handleRate = async (cocktailId: string, stars: number) => {
    const { error: rErr } = await supabase.from('cocktails_invented').update({ rating: stars }).eq('id', cocktailId);
    if (rErr) console.error('Error al guardar valoración:', rErr.message);
    else setCocktailsList(prev => prev.map(c => c.id === cocktailId ? { ...c, rating: stars } : c));
  };

  const allAvailableTags  = [...new Set(cocktailsList.flatMap(c => c.tags || []))];
  const filteredCocktails = activeFilter ? cocktailsList.filter(c => (c.tags || []).includes(activeFilter)) : cocktailsList;

  const handleDeleteCocktail = async (cocktail: Cocktail) => {
    if (!window.confirm(app.confirmDelete(cocktail.name))) return;
    setDeletingId(cocktail.id);
    try {
      const { error: err } = await supabase.from('cocktails_invented').delete().eq('id', cocktail.id).eq('user_id', user!.id);
      if (err) throw err;
      await supabase.from('cocktail_jobs').delete().eq('name', cocktail.name);
      imageCache.current.delete(cocktail.id);
      if (activeCocktailId === cocktail.id) { setResponse(''); setCocktailImage(null); setActiveCocktailId(null); }
      await loadCocktails();
    } catch (e: any) { alert(app.deleteError + e.message); }
    finally { setDeletingId(null); }
  };

  const handleViewCocktail = async (cocktail: Cocktail) => {
    const reqId = ++currentReqId.current;
    setActiveCocktailId(cocktail.id);
    setResponse(cocktail.recipe);
    setError(''); setCocktailImage(null); setImageLoading(false);
    setImageStatus(''); setPrompt(''); setSelectedMood(null);
    mainPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    lastCocktailNameRef.current  = cocktail.name;
    lastRecipeRef.current        = cocktail.recipe;
    lastImageKeywordsRef.current = null;
    lastImagePromptRef.current   = buildImagePrompt(cocktail.name, cocktail.recipe, null);
    if (cocktail.image_path?.trim() && !cocktail.image_path.includes('default-cocktail')) {
      imageCache.current.set(cocktail.id, cocktail.image_path);
      setCocktailImage(cocktail.image_path); return;
    }
    const cached = imageCache.current.get(cocktail.id);
    if (cached) { setCocktailImage(cached); return; }
    const { data: { session } } = await supabase.auth.getSession();
    generateImage(`${cocktail.name} cocktail drink, elegant glass, professional bar photo`, cocktail.name, reqId, cocktail.id, session?.access_token, true);
  };

  const handleRegenerateImage = async () => {
    if (imageLoading) return;
    const reqId = ++currentReqId.current;
    const cocktailName  = lastCocktailNameRef.current || 'cocktail';
    const recipe        = lastRecipeRef.current;
    const keywords      = lastImageKeywordsRef.current;
    const freshPrompt   = recipe ? buildImagePrompt(cocktailName, recipe, keywords) : lastImagePromptRef.current || `${cocktailName} cocktail drink, elegant glass`;
    const variantPrompt = `${freshPrompt}, variation ${Math.floor(Math.random() * 9) + 2}`;
    if (activeCocktailId) imageCache.current.delete(activeCocktailId);
    setCocktailImage(null);
    let token: string | undefined;
    if (activeCocktailId) { const { data: { session } } = await supabase.auth.getSession(); token = session?.access_token; }
    generateImage(variantPrompt, cocktailName, reqId, activeCocktailId ?? undefined, token, !!activeCocktailId);
  };

  const generateImage = async (imagePrompt: string, cocktailName: string, reqId: number, cocktailId?: string, token?: string, saveToDb = false) => {
    lastImagePromptRef.current  = imagePrompt;
    lastCocktailNameRef.current = cocktailName;
    const isActive = () => reqId === currentReqId.current;
    if (!isActive()) return;
    setImageLoading(true);
    setImageStatus(app.generatingImage.replace('🎨 ', ''));
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    try {
      const res = await fetch('/api/pollinations-proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: imagePrompt }) });
      if (!isActive()) return;
      if (res.ok && (res.headers.get('content-type') || '').startsWith('image/')) {
        const blob = await res.blob();
        if (!isActive()) return;
        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;
        if (cocktailId) imageCache.current.set(cocktailId, blobUrl);
        setCocktailImage(blobUrl); setImageStatus('');
        if (saveToDb && cocktailId && token) persistImage(cocktailId, blob, token);
        return;
      }
      if (!isActive()) return;
      setImageStatus(app.searchingImage);
      const fbRes  = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(cocktailName.split(' ')[0])}`);
      const fbData = await fbRes.json();
      if (!isActive()) return;
      const fallbackUrl = fbData.drinks?.[0]?.strDrinkThumb ?? null;
      if (fallbackUrl) {
        if (cocktailId) imageCache.current.set(cocktailId, fallbackUrl);
        setCocktailImage(fallbackUrl);
        if (saveToDb && cocktailId && token) persistImage(cocktailId, fallbackUrl, token);
      } else { setCocktailImage('/default-cocktail.jpg'); }
      setImageStatus('');
    } catch { if (!isActive()) return; setCocktailImage('/default-cocktail.jpg'); setImageStatus(''); }
    finally { if (isActive()) setImageLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent, _retryAttempt = 0) => {
    if (e?.preventDefault) e.preventDefault();
    if (!prompt.trim() || !user) return;

    const MAX_RETRIES = 3;
    const actualPrompt = selectedMood && moodPromptRef.current ? moodPromptRef.current : prompt;
    const reqId = ++currentReqId.current;
    setActiveCocktailId(null); setLoading(true);
    setResponse(''); setError(''); setCocktailImage(null); setImageStatus(''); setImageLoading(false);
    if (_retryAttempt === 0) { setRetryMsg(''); setRetryCount(0); }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt: actualPrompt, shouldSave, locale, moodId: selectedMood }),
      });

      // Errores HTTP antes del stream (401, 429, 500...)
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Error del servidor' }));
        if (res.status === 429) { setPricingLimitReached(true); setShowPricing(true); }
        else setError(data.error || 'Error');
        return;
      }

      // Leer el stream SSE
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let streamedText = '';
      let prefixText = '';

      // Filtro cliente: elimina líneas COCTEL:/IMAGE: que hayan escapado del servidor
      const cleanRecipe = (text: string) =>
        text
          .replace(/^(?:COCTEL|CÓCTEL|CÓCTEL|IMAGE)\s*:\s*.+$/gim, '')
          .replace(/^\s*\n/, '')
          .trimStart();

      setLoading(false); // el modelo ya responde, quitamos el spinner

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (reqId !== currentReqId.current) { reader.cancel(); return; }

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() ?? '';

        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          let parsed: any;
          try { parsed = JSON.parse(event.slice(6)); } catch { continue; }

          if (parsed.type === 'token') {
            streamedText += parsed.text;
            setResponse(cleanRecipe(prefixText + streamedText));

          } else if (parsed.type === 'prefix') {
            prefixText = parsed.text;
            setResponse(cleanRecipe(prefixText + streamedText));

          } else if (parsed.type === 'error') {
            setError(parsed.message || 'Error');

          } else if (parsed.type === 'done') {
            if (reqId !== currentReqId.current) return;

            const finalText = prefixText + streamedText;

            // ── Detectar respuesta mala y reintentar ───────────────────────────
            if (isResponseBad(finalText) && _retryAttempt < MAX_RETRIES) {
              const { msg, index } = getRetryMessage(retryMsgIndexRef.current, locale);
              retryMsgIndexRef.current = index;
              setRetryMsg(msg);
              setRetryCount(_retryAttempt + 1);
              setResponse(''); setLoading(true);
              // Esperar 1.5s para que el usuario lea el mensaje, luego reintentar
              setTimeout(() => {
                if (reqId === currentReqId.current) {
                  handleSubmit({ preventDefault: () => {} } as React.FormEvent, _retryAttempt + 1);
                }
              }, 1800);
              return;
            }

            // Respuesta OK—limpiar mensaje de reintento
            setRetryMsg(''); setRetryCount(0);
            setSelectedMood(null);

            const cocktailName = parsed.cocktailName || 'cocktail';
            const imagePromptFinal = parsed.imagePrompt || `${cocktailName} cocktail drink, elegant glass`;

            lastRecipeRef.current        = prefixText + streamedText;
            lastCocktailNameRef.current  = cocktailName;
            lastImageKeywordsRef.current = parsed.imagePrompt || null;
            lastImagePromptRef.current   = imagePromptFinal;

            generateImage(imagePromptFinal, cocktailName, reqId, parsed.cocktailId ?? undefined, token, !!parsed.cocktailId);

            if (shouldSave && parsed.cocktailId) {
              setActiveCocktailId(parsed.cocktailId);
              await loadCocktails();
              if (parsed.jobId && token) {
                fetch('/api/process-job', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ jobId: parsed.jobId }),
                }).catch(() => {});
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (reqId !== currentReqId.current) return;
      setError(err.message || 'Error');
    } finally {
      if (reqId === currentReqId.current) setLoading(false);
    }
  };

  // ─── Estados de carga y pre-auth ──────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#000810]">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
        <div className="text-6xl animate-bounce">🍸</div>
        <div className="w-8 h-8 border-4 border-[#f5c842] border-t-transparent rounded-full animate-spin" />
      </motion.div>
    </div>
  );

  // ← Landing page + modal de auth flotando encima
  if (!user) return (
    <>
      <LandingPage onGetStarted={() => setShowAuth(true)} />
      <AnimatePresence>
        {showAuth && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <AuthModal onAuthSuccess={() => setShowAuth(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // ─── App principal ────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-300 ${tc.pageBg}`}>

      <AnimatePresence>
        {shareTarget && (
          <ShareCardModal
            cocktailName={shareTarget.name}
            recipe={shareTarget.recipe}
            imageSrc={imageCache.current.get(shareTarget.id) || shareTarget.image_path}
            rating={shareTarget.rating || 0}
            tags={shareTarget.tags || []}
            onClose={() => setShareTarget(null)}
          />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">

        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-6 px-1 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${tc.avatar}`}>
              {user.email?.[0].toUpperCase()}
            </div>
            <span className={`text-sm truncate max-w-[180px] ${tc.textMuted}`}>{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLocale(locale === 'es' ? 'en' : 'es')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tc.btnToggle}`}>{app.switchToEnglish}</button>
            <button onClick={toggleTheme} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tc.btnToggle}`}>{isDark ? app.switchToLight : app.switchToDark}</button>
            <button onClick={handleLogout} className={`px-4 py-1.5 rounded-lg border text-xs font-medium transition-all ${tc.btnSignOut}`}>{app.signOut}</button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">

          <div className="lg:col-span-2 relative" ref={mainPanelRef}>
            <motion.header initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="text-center mb-8">
              <motion.div animate={{ rotate: [0, -8, 8, -4, 4, 0] }} transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }} className="text-7xl md:text-8xl mb-4 inline-block">🍸</motion.div>
              <h1 className={`text-4xl md:text-6xl font-bold font-serif ${tc.textTitle} ${tc.titleGlow}`}>{app.title}</h1>
              <p className={`text-base md:text-xl mt-2 font-medium ${tc.textTagline}`}>{app.tagline}</p>
            </motion.header>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className={`rounded-2xl shadow-2xl p-5 md:p-8 ${tc.cardBg}`}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <MoodSelector selectedMood={selectedMood} onSelect={handleMoodSelect} />
                <div>
                  <label className={`block font-medium mb-2 text-lg ${tc.textLabel}`}>{app.inputLabel}</label>
                  <input type="text" value={prompt} onChange={(e) => handlePromptChange(e.target.value)}
                    placeholder={app.inputPlaceholder} disabled={loading}
                    className={`w-full px-5 py-3 rounded-xl border-2 outline-none transition-colors ${tc.inputBg}`} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="shouldSave" checked={shouldSave} onChange={(e) => setShouldSave(e.target.checked)} className="w-4 h-4 accent-current" />
                  <label htmlFor="shouldSave" className={`text-sm ${tc.textMuted}`}>{app.saveToCatalog}</label>
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.97 }}
                  className={`w-full font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-60 ${tc.btnPrimary}`}>
                  {loading ? app.mixing : app.askBartender}
                </motion.button>
              </form>

              <AnimatePresence>
                {error && <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit" className={`mt-6 p-4 rounded-xl text-sm border ${tc.errorBox}`}>❌ {error}</motion.div>}
              </AnimatePresence>

              {/* Banner de reintento con mensaje de bartender */}
              <AnimatePresence>
                {retryMsg && (
                  <motion.div
                    key={retryMsg}
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.35 }}
                    className={`mt-5 p-4 rounded-xl border flex items-start gap-3
                      ${isDark ? 'bg-[#f5c842]/6 border-[#f5c842]/20' : 'bg-[#c9a227]/6 border-[#c9a227]/25'}`}
                  >
                    <span className="text-2xl shrink-0 mt-0.5">👨‍🍳</span>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
                        {retryMsg}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/60'}`}>
                        {locale === 'es'
                          ? `Intento ${retryCount} de ${3}...`
                          : `Attempt ${retryCount} of ${3}...`}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {loading && (
                  <motion.div variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="mt-6 flex flex-col items-center gap-3">
                    <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${tc.spinner}`} />
                    <p className={`text-sm ${tc.textSpinner}`}>🍸 {app.mixing || 'Mezclando ingredientes...'}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {response && !loading && (
                  <motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit" className={`mt-8 p-5 rounded-xl ${tc.recipeBox}`}>
                    <h2 className={`text-xl font-bold mb-2 ${tc.textRecommTitle}`}>{app.recommendation}</h2>
                    <div className={`prose max-w-none ${isDark ? 'prose-invert' : 'prose-stone'} ${tc.textRecipe}`}><ReactMarkdown>{response}</ReactMarkdown></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {imageLoading && (
                  <motion.div variants={fadeIn} initial="hidden" animate="visible" exit="exit" className="mt-6 flex flex-col items-center gap-3">
                    <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${tc.spinner}`} />
                    <p className={`text-sm ${tc.textSpinner}`}>🎨 {imageStatus || app.generatingImage.replace('🎨 ', '')}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {cocktailImage && !imageLoading && (
                  <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="exit" className="mt-4 flex flex-col items-center gap-3">
                    <img key={cocktailImage} src={cocktailImage} alt="Cóctel"
                      className={`rounded-xl shadow-lg max-h-72 object-cover border-2 ${tc.borderImg}`}
                      onError={() => setCocktailImage('/default-cocktail.jpg')} />
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      <motion.button onClick={handleRegenerateImage} disabled={imageLoading}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${tc.btnToggle}`}>
                        <span>🎲</span><span>{app.changeImage}</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const cocktail = cocktailsList.find(c => c.id === activeCocktailId);
                          setShareTarget(cocktail ?? { id: '', name: lastCocktailNameRef.current || 'Cóctel', recipe: lastRecipeRef.current, image_path: cocktailImage, created_at: '', user_id: '', rating: 0, tags: [] });
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${tc.btnToggle}`}>
                        <span>📤</span><span>{app.shareCard}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="lg:col-span-1 flex flex-col">

            {/* Cóctel del Día */}
            <DailyDrink
              onShowRecipe={(name, recipe, imagePrompt) => {
                const reqId = ++currentReqId.current;
                setResponse(recipe);
                setError('');
                setCocktailImage(null);
                setActiveCocktailId(null);
                setPrompt('');
                setSelectedMood(null);
                lastCocktailNameRef.current  = name;
                lastRecipeRef.current        = recipe;
                lastImageKeywordsRef.current = imagePrompt || null;
                // Usar el imagePrompt del modelo (contiene el vaso real: "copper mug", etc.)
                // Si no hay, derivarlo de la receta
                const imgPrompt = imagePrompt || buildImagePrompt(name, recipe, null);
                lastImagePromptRef.current = imgPrompt;
                mainPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                generateImage(imgPrompt, name, reqId, undefined, undefined, false);
              }}
            />

            <div className={`rounded-2xl p-5 flex flex-col flex-1 ${tc.catalogBg}`}>
              <div className="mb-4">
                <h2 className={`text-2xl font-bold ${tc.textPrimary}`}>{app.catalog}</h2>
                <p className={`text-xs mt-1 ${tc.textSub}`}>{app.cocktailsSaved(cocktailsList.length)}</p>
              </div>
              <TagFilter availableTags={allAvailableTags} activeFilter={activeFilter} onFilter={setActiveFilter} />
              {cocktailsList.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <p className="text-4xl mb-3">🍹</p>
                  <p className={`text-sm ${tc.textMuted}`}>{app.noCocktails}</p>
                  <p className={`text-xs mt-1 ${tc.textFaint}`}>{app.noCocktailsHint}</p>
                </motion.div>
              ) : filteredCocktails.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className={`text-sm ${tc.textMuted}`}>{app.noResults}</p>
                </motion.div>
              ) : (
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  <AnimatePresence initial={false}>
                    {filteredCocktails.map((item, i) => {
                      const isActive   = activeCocktailId === item.id;
                      const isDeleting = deletingId === item.id;
                      return (
                        <motion.div key={item.id} custom={i} variants={fadeUp} initial="hidden" animate="visible" exit="exit" layout
                          className={`rounded-xl border transition-all duration-200 overflow-hidden ${tc.catalogCard(isActive)}`}>
                          <div className="flex items-center gap-3 p-3">
                            <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border ${tc.thumbBg} ${tc.borderThumb}`}>
                              {item.image_path ? <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🍸</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm truncate ${tc.catalogCardTitle(isActive)}`}>{item.name}</p>
                              <div className="mt-0.5 flex items-center gap-2">
                                <StarRating rating={item.rating || 0} cocktailId={item.id} onRate={handleRate} size="sm" />
                                <span className={`text-[10px] ${tc.textFaint}`}>{new Date(item.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="px-3 pb-1">
                            <p className={`text-xs leading-relaxed line-clamp-2 ${tc.textSub}`}>{item.recipe?.replace(/[#*`]/g, '').substring(0, 80)}...</p>
                          </div>
                          {(item.tags || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 px-3 pb-2">
                              {(item.tags || []).slice(0, 3).map(tagId => {
                                const tag = getTagById(tagId);
                                if (!tag) return null;
                                return (
                                  <span key={tagId} onClick={() => setActiveFilter(activeFilter === tagId ? null : tagId)}
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full border cursor-pointer transition-all ${activeFilter === tagId ? isDark ? 'border-[#f5c842]/60 bg-[#f5c842]/15 text-[#f5c842]' : 'border-[#8B6914]/60 bg-[#8B6914]/15 text-[#6b4f0a]' : isDark ? 'border-[#f5c842]/15 text-[#f5c842]/55 hover:border-[#f5c842]/35' : 'border-[#8B6914]/15 text-[#8B6914]/55 hover:border-[#8B6914]/35'}`}>
                                    {tag.emoji} {locale === 'es' ? tag.label : tag.labelEn}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          <div className={`flex border-t ${tc.borderDivider}`}>
                            <button onClick={() => handleViewCocktail(item)} disabled={isDeleting}
                              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold transition-all disabled:opacity-40 ${tc.btnView(isActive)}`}>
                              {isActive ? app.visible : `👁 ${app.viewRecipe}`}
                            </button>
                            <div className={`w-px ${tc.borderDivider}`} />
                            <button onClick={() => setShareTarget({ ...item, image_path: imageCache.current.get(item.id) || item.image_path })} title={app.shareCard}
                              className={`px-3 py-2 text-xs font-semibold transition-all ${tc.btnView(false)}`}>📤</button>
                            <div className={`w-px ${tc.borderDivider}`} />
                            <button onClick={() => handleDeleteCocktail(item)} disabled={isDeleting}
                              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-red-400/70 hover:bg-red-900/30 hover:text-red-300 transition-all disabled:opacity-40">
                              {isDeleting ? <><span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /><span>{app.deleting}</span></> : <><span>🗑</span><span>{app.delete}</span></>}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} className="mt-16 pb-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4">
            <div className={`w-20 h-px ${isDark ? 'bg-[#f5c842]/10' : 'bg-[#8B6914]/15'}`} />
            <span className={`text-xs tracking-[0.3em] uppercase font-medium whitespace-nowrap ${isDark ? 'text-[#f5c842]/30' : 'text-[#8B6914]/40'}`}>{locale === 'es' ? 'Con sabor a fiesta' : 'Crafted with taste'}</span>
            <div className={`w-20 h-px ${isDark ? 'bg-[#f5c842]/10' : 'bg-[#8B6914]/15'}`} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className={`h-16 rounded-xl overflow-hidden border shadow-lg transition-all inline-flex ${isDark ? 'border-[#f5c842]/25 shadow-[#f5c842]/10' : 'border-[#d4b870]/35 shadow-[#8B6914]/8'}`} style={{ width: 'fit-content' }}>
            <img src="/logo-borrachos.jpg" alt="Borrach@s y más" className="w-full h-full object-contain" />
          </div>
          <p className={`text-xs italic text-center max-w-xs leading-relaxed ${isDark ? 'text-[#f5c842]/50' : 'text-[#2a1f00]'}`}>&ldquo;Beber es una necesidad, pero saber beber es un Arte.&rdquo;</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-[#f5c842]/25' : 'text-[#3a2a00]'}`}>&copy; 2026 Borrach@s y más. Todos los derechos reservados.</p>
        </div>
      </motion.footer>
    </div>
  );
}
