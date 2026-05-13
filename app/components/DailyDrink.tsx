'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';

interface DailyData {
  name: string;
  tagline: string;
  ingredients: string[];
  tip: string;
  imagePrompt: string;
  dateKey: string;
}

interface DailyDrinkProps {
  /** Se llama con (name, recipe, imagePrompt) — la primera vez llama a la API, las demás usa caché */
  onShowRecipe: (name: string, recipe: string, imagePrompt: string) => void;
}

const DATA_KEY   = (date: string, locale: string) => `bartender-daily-data-${date}-${locale}`;
const RECIPE_KEY = (date: string, locale: string) => `bartender-daily-recipe-${date}-${locale}`;

export default function DailyDrink({ onShowRecipe }: DailyDrinkProps) {
  const { isDark, locale } = useApp();
  const [data, setData]           = useState<DailyData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  const todayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      try {
        const cached = localStorage.getItem(DATA_KEY(todayKey, locale));
        if (cached) { setData(JSON.parse(cached)); setLoading(false); return; }
      } catch { /* ignore */ }

      try {
        const res = await fetch(`/api/daily-cocktail?locale=${locale}&date=${todayKey}`);
        if (!res.ok) throw new Error('API error');
        const json: DailyData = await res.json();
        setData(json);
        localStorage.setItem(DATA_KEY(todayKey, locale), JSON.stringify(json));
      } catch (e) {
        console.error('[DailyDrink]', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locale, todayKey]);

  const handleViewRecipe = async () => {
    if (!data) return;

    // 1. Verificar caché de receta completa
    try {
      const cachedRecipe = localStorage.getItem(RECIPE_KEY(todayKey, locale));
      if (cachedRecipe) {
        onShowRecipe(data.name, cachedRecipe, data.imagePrompt);
        return;
      }
    } catch { /* ignore */ }

    // 2. Primera vez: pedir la receta completa a la API y cachearla
    setLoadingRecipe(true);
    try {
      const res = await fetch(`/api/daily-cocktail?locale=${locale}&date=${todayKey}&full=true`);
      if (!res.ok) throw new Error('Error al cargar receta');
      const json = await res.json();
      const recipe = json.fullRecipe || buildFallbackRecipe(data, locale);
      localStorage.setItem(RECIPE_KEY(todayKey, locale), recipe);
      onShowRecipe(data.name, recipe, data.imagePrompt);
    } catch {
      // Si falla, construir receta desde los datos básicos
      const fallback = buildFallbackRecipe(data, locale);
      localStorage.setItem(RECIPE_KEY(todayKey, locale), fallback);
      onShowRecipe(data.name, fallback, data.imagePrompt);
    } finally {
      setLoadingRecipe(false);
    }
  };

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
      {/* Header clicable */}
      <button onClick={() => setExpanded(v => !v)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌟</span>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#f5c842]/60' : 'text-[#8B6914]/65'}`}>
              {locale === 'es' ? 'Cóctel del Día' : 'Cocktail of the Day'}
            </p>
            {data && !loading && (
              <p className={`text-sm font-bold truncate max-w-[160px] ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
                {data.name}
              </p>
            )}
          </div>
        </div>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}
          className={`text-xs ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/50'}`}>▼</motion.span>
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
                  <div className={`w-6 h-6 rounded-full animate-spin border-[3px] border-t-transparent ${isDark ? 'border-[#f5c842]' : 'border-[#8B6914]'}`} />
                  <p className={`text-xs ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/50'}`}>
                    {locale === 'es' ? 'Preparando el cóctel del día...' : "Preparing today's cocktail..."}
                  </p>
                </div>
              ) : data ? (
                <div className="pt-3 space-y-3">
                  <p className={`text-xs italic leading-relaxed ${isDark ? 'text-[#f5c842]/75' : 'text-[#4a3a0a]'}`}>"{data.tagline}"</p>

                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/60'}`}>
                      {locale === 'es' ? 'Ingredientes' : 'Ingredients'}
                    </p>
                    <ul className="space-y-1">
                      {(data.ingredients || []).slice(0, 4).map((ing, i) => (
                        <li key={i} className={`flex items-start gap-1.5 text-xs ${isDark ? 'text-[#f5c842]/80' : 'text-[#2a1800]'}`}>
                          <span className={`shrink-0 w-1 h-1 rounded-full mt-1.5 ${isDark ? 'bg-[#f5c842]/60' : 'bg-[#8B6914]/60'}`} />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`rounded-lg px-3 py-2 ${isDark ? 'bg-[#f5c842]/6 border border-[#f5c842]/15' : 'bg-[#8B6914]/6 border border-[#c9a227]/20'}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/60'}`}>
                      {locale === 'es' ? '💡 Tip del bartender' : '💡 Bartender tip'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-[#f5c842]/70' : 'text-[#3a2a00]'}`}>{data.tip}</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleViewRecipe}
                    disabled={loadingRecipe}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2
                      ${isDark
                        ? 'bg-gradient-to-r from-[#f5c842] to-[#d4a832] text-[#000510] shadow-md shadow-[#f5c842]/20'
                        : 'bg-gradient-to-r from-[#c9a227] to-[#a07d10] text-white shadow-md shadow-[#8B6914]/20'}`}
                  >
                    {loadingRecipe
                      ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>{locale === 'es' ? 'Preparando...' : 'Loading...'}</span></>
                      : <>{locale === 'es' ? 'Ver receta completa →' : 'See full recipe →'}</>
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

/** Receta básica de fallback si la API falla */
function buildFallbackRecipe(data: DailyData, locale: string): string {
  const { name, ingredients, tip } = data;
  if (locale === 'en') {
    return `### 🍹 ${name}\n\n**Ingredients:**\n${ingredients.map(i => `- ${i}`).join('\n')}\n\n**Bartender tip:** ${tip}`;
  }
  return `### 🍹 ${name}\n\n**Ingredientes:**\n${ingredients.map(i => `- ${i}`).join('\n')}\n\n**Tip del bartender:** ${tip}`;
}
