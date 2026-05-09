'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';
import { supabase } from '@/lib/supabaseClient';

interface DailyData {
  name: string;
  tagline: string;
  ingredients: string[];
  tip: string;
  imagePrompt: string;
  dateKey: string;
}

interface DailyDrinkProps {
  /** Muestra una receta ya generada en el panel principal (sin llamar a la API) */
  onShowRecipe: (name: string, recipe: string, imagePrompt?: string) => void;
}

const DAILY_KEY  = 'bartender-daily-v2-';
const RECIPE_KEY = 'bartender-daily-recipe-v3-';

export default function DailyDrink({ onShowRecipe }: DailyDrinkProps) {
  const { isDark, locale } = useApp();

  const [data, setData]               = useState<DailyData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(false);
  const [fullRecipe, setFullRecipe]   = useState<string | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);

  const todayKey      = new Date().toISOString().split('T')[0];
  const cacheKey      = `${DAILY_KEY}${todayKey}-${locale}`;
  const recipeCacheKey = `${RECIPE_KEY}${todayKey}-${locale}`;

  // Cargar datos del día
  useEffect(() => {
    const load = async () => {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { setData(JSON.parse(cached)); setLoading(false); return; }
      } catch { /* ignore */ }
      try {
        const res = await fetch(`/api/daily-cocktail?locale=${locale}&date=${todayKey}`);
        if (!res.ok) throw new Error('API error');
        const json: DailyData = await res.json();
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
      } catch (e) {
        console.error('[DailyDrink]', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locale, todayKey, cacheKey]);

  // Cargar receta cacheada — validar que no tenga líneas COCTEL:/IMAGE: (caché corrupta)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(recipeCacheKey);
      if (!cached) return;
      const isCorrupt = /^(COCTEL|IMAGE)\s*:/mi.test(cached);
      if (isCorrupt) {
        localStorage.removeItem(recipeCacheKey);
        localStorage.removeItem(recipeCacheKey + '-img');
      } else {
        setFullRecipe(cached);
      }
    } catch { /* ignore */ }
  }, [recipeCacheKey]);

  // ── Botón "Ver receta completa" ──────────────────────────────────────────
  const handleViewRecipe = async () => {
    if (!data) return;

    // ✅ Ya tenemos la receta cacheada → mostrar directamente sin API
    if (fullRecipe) {
      const cachedImg = localStorage.getItem(recipeCacheKey + '-img') || undefined;
      onShowRecipe(data.name, fullRecipe, cachedImg);
      mainScrollTop();
      return;
    }

    // 🔄 Primera vez → generar vía streaming y cachear
    setRecipeLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userPrompt = locale === 'es'
        ? `Dame la receta completa y detallada del cóctel "${data.name}"`
        : `Give me the full detailed recipe for the "${data.name}" cocktail`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ prompt: userPrompt, shouldSave: false, locale }),
      });

      if (!res.ok) throw new Error('API error');

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer    = '';
      let streamedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() ?? '';

        for (const raw of events) {
          if (!raw.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(raw.slice(6));
            if (parsed.type === 'token') {
              streamedText += parsed.text;
            } else if (parsed.type === 'prefix') {
              // El API añadió el nombre como header — ya viene incluido
              streamedText = parsed.text + streamedText;
            } else if (parsed.type === 'done') {
              const hasName = streamedText.toLowerCase().includes(data.name.toLowerCase().substring(0, 6));
              const finalRecipe = hasName
                ? streamedText
                : `### 🍹 ${data.name}\n\n${streamedText}`;
              // Guardar receta + imagePrompt en caché
              localStorage.setItem(recipeCacheKey, finalRecipe);
              localStorage.setItem(recipeCacheKey + '-img', parsed.imagePrompt || '');
              setFullRecipe(finalRecipe);
              onShowRecipe(data.name, finalRecipe, parsed.imagePrompt);
              mainScrollTop();
            }
          } catch { /* parse error, skip */ }
        }
      }
    } catch (e) {
      console.error('[DailyDrink] recipe error', e);
    } finally {
      setRecipeLoading(false);
    }
  };

  const mainScrollTop = () =>
    document.querySelector('main, [data-main]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const tipLabel = locale === 'es' ? '💡 Tip del bartender' : '💡 Bartender tip';
  const btnLabel = recipeLoading
    ? (locale === 'es' ? 'Preparando receta...' : 'Preparing recipe...')
    : fullRecipe
      ? (locale === 'es' ? 'Ver receta guardada →' : 'Show saved recipe →')
      : (locale === 'es' ? 'Ver receta completa →' : 'See full recipe →');

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={`rounded-2xl overflow-hidden mb-4 border transition-all
        ${isDark
          ? 'bg-gradient-to-br from-[#0a0f2e] via-[#000c1f] to-[#050810] border-[#f5c842]/25 shadow-lg shadow-[#f5c842]/8'
          : 'bg-gradient-to-br from-[#fdf8ec] via-[#faf4e0] to-[#f5edcc] border-[#c9a227]/30 shadow-lg shadow-[#8B6914]/8'
        }`}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🌟</span>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#f5c842]/70' : 'text-[#8B6914]/70'}`}>
              {locale === 'es' ? 'Cóctel del Día' : 'Cocktail of the Day'}
            </p>
            {data && !loading && (
              <p className={`text-sm font-bold truncate max-w-[160px] ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
                {data.name}
              </p>
            )}
          </div>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={`text-xs ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/50'}`}
        >
          ▼
        </motion.span>
      </button>

      {/* Contenido expandible */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-4 border-t ${isDark ? 'border-[#f5c842]/10' : 'border-[#c9a227]/15'}`}>
              {loading ? (
                <div className="py-6 flex flex-col items-center gap-3">
                  <div className={`w-6 h-6 rounded-full animate-spin ${isDark ? 'border-[#f5c842]' : 'border-[#8B6914]'}`} style={{ borderWidth: '3px', borderStyle: 'solid', borderTopColor: 'transparent' }} />
                  <p className={`text-xs ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/50'}`}>
                    {locale === 'es' ? 'Preparando el cóctel del día...' : "Preparing today's cocktail..."}
                  </p>
                </div>
              ) : data ? (
                <div className="pt-3 space-y-3">
                  {/* Tagline */}
                  <p className={`text-xs italic leading-relaxed ${isDark ? 'text-[#f5c842]/75' : 'text-[#4a3a0a]'}`}>
                    "{data.tagline}"
                  </p>

                  {/* Ingredientes */}
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/60'}`}>
                      {locale === 'es' ? 'Ingredientes' : 'Ingredients'}
                    </p>
                    <ul className="space-y-1">
                      {(data.ingredients || []).slice(0, 4).map((ing, i) => (
                        <li key={i} className={`flex items-start gap-1.5 text-xs ${isDark ? 'text-[#f5c842]/80' : 'text-[#2a1800]'}`}>
                          <span className={`shrink-0 w-1 h-1 rounded-full ${isDark ? 'bg-[#f5c842]/60' : 'bg-[#8B6914]/60'}`} style={{ marginTop: '5px' }} />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tip */}
                  <div className={`rounded-lg px-3 py-2 ${isDark ? 'bg-[#f5c842]/6 border border-[#f5c842]/15' : 'bg-[#8B6914]/6 border border-[#c9a227]/20'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/60'}`}>
                      {tipLabel}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-[#f5c842]/70' : 'text-[#3a2a00]'}`}>{data.tip}</p>
                  </div>

                  {/* Badge de caché */}
                  {fullRecipe && (
                    <p className={`text-[10px] text-center ${isDark ? 'text-[#f5c842]/30' : 'text-[#8B6914]/40'}`}>
                      ✓ {locale === 'es' ? 'Receta guardada hoy' : 'Recipe saved today'}
                    </p>
                  )}

                  {/* Botón ver receta */}
                  <motion.button
                    whileHover={{ scale: recipeLoading ? 1 : 1.02 }}
                    whileTap={{ scale: recipeLoading ? 1 : 0.97 }}
                    onClick={handleViewRecipe}
                    disabled={recipeLoading}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-70
                      ${isDark
                        ? 'bg-gradient-to-r from-[#f5c842] to-[#d4a832] text-[#000510] shadow-md shadow-[#f5c842]/20'
                        : 'bg-gradient-to-r from-[#c9a227] to-[#a07d10] text-white shadow-md shadow-[#8B6914]/20'
                      }`}
                  >
                    {recipeLoading
                      ? <span className="flex items-center justify-center gap-2">
                          <span className="w-3 h-3 rounded-full animate-spin inline-block" style={{ border: '2px solid currentColor', borderTopColor: 'transparent' }} />
                          {btnLabel}
                        </span>
                      : btnLabel
                    }
                  </motion.button>
                </div>
              ) : (
                <p className={`text-xs py-4 text-center ${isDark ? 'text-[#f5c842]/40' : 'text-[#8B6914]/40'}`}>
                  {locale === 'es' ? 'No disponible hoy' : 'Not available today'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
