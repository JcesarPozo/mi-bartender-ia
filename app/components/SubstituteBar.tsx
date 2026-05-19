'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';

interface SubstituteBarProps {
  recipe: string;
  cocktailName: string;
}

function parseIngredients(recipe: string): string[] {
  const lines  = recipe.split('\n');
  const result: string[] = [];
  let inSection = false;

  for (const raw of lines) {
    const line = raw.trim();

    // Inicio de sección: heading o **negrita** que contenga "ingrediente"
    if (
      /ingrediente|ingredient/i.test(line) &&
      (/^#{1,4}\s/.test(line) || /^\*{1,2}[^*]+\*{1,2}/.test(line) || /:$/.test(line))
    ) { inSection = true; continue; }

    // Fin de sección: nuevo heading o nueva negrita-sección distinta
    if (inSection && line.length > 0) {
      const isNewSection =
        (/^#{1,4}\s/.test(line) && !/ingrediente|ingredient/i.test(line)) ||
        (/^\*{1,2}[^*]+\*{1,2}:?\s*$/.test(line) && !/ingrediente|ingredient/i.test(line));
      if (isNewSection) inSection = false;
    }

    if (inSection && /^[-*•]\s+/.test(line)) {
      let name = line
        .replace(/^[-*•]\s+/, '')
        .replace(/^\d[\d/.,]*\s*(ml|cl|dl|l|oz|fl\.?\s*oz|g|kg|tsp|tbsp|cup|cups|cdta|cdas?|partes?|parts?|dash|dashes)\.?\s*/gi, '')
        .replace(/^\d+\s+/, '')
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/,.*$/, '')
        .replace(/\*+/g, '')
        .trim();
      if (name.length >= 2 && name.length <= 35) {
        result.push(name.charAt(0).toUpperCase() + name.slice(1));
      }
    }
  }

  // Fallback: bullets con medidas en cualquier parte del texto
  if (result.length === 0) {
    for (const raw of lines) {
      const line = raw.trim();
      if (/^[-*•]\s+/.test(line) && /\d+\s*(ml|oz|cl|g|tsp|tbsp|cdas?)/i.test(line)) {
        let name = line
          .replace(/^[-*•]\s+/, '')
          .replace(/^\d[\d/.,]*\s*(ml|cl|oz|g|kg|tsp|tbsp|cdas?)\.?\s*/gi, '')
          .replace(/^\d+\s+/, '')
          .replace(/\s*\([^)]*\)/g, '')
          .replace(/,.*$/, '')
          .replace(/\*+/g, '')
          .trim();
        if (name.length >= 2 && name.length <= 35) {
          result.push(name.charAt(0).toUpperCase() + name.slice(1));
        }
      }
    }
  }

  return [...new Set(result)].slice(0, 9);
}

export default function SubstituteBar({ recipe, cocktailName }: SubstituteBarProps) {
  const { isDark, locale } = useApp();
  const isEs = locale === 'es';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(false);
  const [answer, setAnswer]     = useState('');
  const [error, setError]       = useState('');

  // ── Fix 1: resetear todo al cambiar de receta ──────────────────────────────
  useEffect(() => {
    setSelected(new Set());
    setLoading(false);
    setAnswer('');
    setError('');
  }, [recipe]);

  const ingredients = useMemo(() => parseIngredients(recipe), [recipe]);
  if (ingredients.length === 0) return null;

  const clearAll = () => {
    setSelected(new Set());
    setAnswer('');
    setError('');
  };

  const toggleIngredient = (ing: string) => {
    if (answer) { setAnswer(''); setError(''); }
    setSelected(prev => {
      const next = new Set(prev);
      next.has(ing) ? next.delete(ing) : next.add(ing);
      return next;
    });
  };

  const askSubstitutes = async () => {
    if (selected.size === 0 || loading) return;
    setLoading(true);
    setAnswer('');
    setError('');
    try {
      const res = await fetch('/api/substitute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: [...selected],
          cocktailName,
          locale, // ← Fix 2: enviamos el locale explícito
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || 'Error';
        throw new Error(msg);
      }
      setAnswer(data.answer);
    } catch (e: any) {
      setError(e.message || (isEs ? 'No se pudo obtener sustitutos.' : 'Could not get substitutes.'));
    } finally {
      setLoading(false);
    }
  };

  // Estilos
  const chipOff = isDark
    ? 'border-[#f5c842]/18 text-[#f5c842]/60 hover:border-[#f5c842]/45 hover:text-[#f5c842] hover:bg-[#f5c842]/8'
    : 'border-[#8B6914]/18 text-[#8B6914]/60 hover:border-[#8B6914]/40 hover:text-[#8B6914] hover:bg-[#8B6914]/6';
  const chipOn = isDark
    ? 'border-[#f5c842]/70 text-[#f5c842] bg-[#f5c842]/14 shadow-sm shadow-[#f5c842]/10'
    : 'border-[#8B6914]/65 text-[#6b4f0a] bg-[#8B6914]/12 shadow-sm shadow-[#8B6914]/8';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className={`mt-5 rounded-xl border p-4
        ${isDark ? 'border-[#f5c842]/12 bg-[#f5c842]/3' : 'border-[#8B6914]/12 bg-[#8B6914]/3'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">🔄</span>
          <p className={`text-xs font-semibold ${isDark ? 'text-[#f5c842]/75' : 'text-[#4a3a0a]'}`}>
            {isEs ? '¿Te falta algo?' : 'Missing something?'}
          </p>
        </div>
        {selected.size > 0 && (
          <button onClick={clearAll}
            className={`text-[10px] transition-colors ${isDark ? 'text-[#f5c842]/35 hover:text-[#f5c842]/60' : 'text-[#8B6914]/35 hover:text-[#8B6914]/60'}`}>
            {isEs ? 'Limpiar' : 'Clear'}
          </button>
        )}
      </div>
      <p className={`text-[10px] mb-3 ${isDark ? 'text-[#f5c842]/40' : 'text-[#8B6914]/45'}`}>
        {isEs ? 'Marca los ingredientes que no tienes:' : 'Select the ingredients you\'re missing:'}
      </p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {ingredients.map(ing => (
          <motion.button key={ing}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }}
            onClick={() => toggleIngredient(ing)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium
              transition-all duration-200 disabled:opacity-50
              ${selected.has(ing) ? chipOn : chipOff}`}
          >
            <span className={`text-[11px] ${selected.has(ing) ? 'opacity-100' : 'opacity-35'}`}>
              {selected.has(ing) ? '✓' : '✕'}
            </span>
            {ing}
          </motion.button>
        ))}
      </div>

      {/* Botón de consulta */}
      <AnimatePresence>
        {selected.size > 0 && !answer && !error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
              onClick={askSubstitutes}
              disabled={loading}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60
                ${isDark ? 'bg-[#f5c842] text-[#000810]' : 'bg-[#8B6914] text-white'}`}
            >
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin border-current" />
                    <span>{isEs ? 'Buscando sustitutos...' : 'Finding substitutes...'}</span></>
                : <><span>🔄</span>
                    <span>
                      {selected.size === 1
                        ? isEs ? `¿Sin ${[...selected][0]}? Ver alternativas` : `No ${[...selected][0]}? See alternatives`
                        : isEs ? `Ver sustitutos para ${selected.size} ingredientes` : `Get substitutes for ${selected.size} ingredients`
                      }
                    </span></>
              }
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Respuesta IA */}
      <AnimatePresence>
        {(answer || error) && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`rounded-xl p-4 border
              ${isDark ? 'bg-[#000c1f] border-[#f5c842]/18' : 'bg-[#faf7ee] border-[#8B6914]/15'}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">👨‍🍳</span>
                  <p className={`text-xs font-bold ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
                    {isEs ? 'El bartender sugiere:' : 'The bartender suggests:'}
                  </p>
                </div>
                <button onClick={clearAll}
                  className={`text-xs px-2 py-0.5 rounded-lg transition-all
                    ${isDark ? 'text-[#f5c842]/35 hover:text-[#f5c842]/65 hover:bg-[#f5c842]/8'
                             : 'text-[#8B6914]/35 hover:text-[#8B6914]/65 hover:bg-[#8B6914]/8'}`}>
                  ✕
                </button>
              </div>
              {error
                ? <p className="text-xs text-red-400">{error}</p>
                : <div className={`text-xs leading-relaxed whitespace-pre-line
                    ${isDark ? 'text-[#f5c842]/85' : 'text-[#2a1800]'}`}>{answer}</div>
              }
              {!error && (
                <button onClick={() => { setAnswer(''); setError(''); }}
                  className={`mt-3 w-full text-[10px] font-semibold py-1.5 rounded-lg border transition-all
                    ${isDark ? 'border-[#f5c842]/15 text-[#f5c842]/45 hover:border-[#f5c842]/35 hover:bg-[#f5c842]/6'
                             : 'border-[#8B6914]/15 text-[#8B6914]/45 hover:border-[#8B6914]/30 hover:bg-[#8B6914]/5'}`}>
                  {isEs ? '↩ Cambiar selección' : '↩ Change selection'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
