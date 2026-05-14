'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';

interface RecipeReaderProps {
  text: string; // texto markdown de la receta
}

// Limpia el markdown y deja texto plano legible en voz alta
function cleanForSpeech(md: string): string {
  return md
    .replace(/#{1,6}\s*/g, '')           // encabezados
    .replace(/\*\*(.+?)\*\*/g, '$1')     // negrita
    .replace(/\*(.+?)\*/g, '$1')         // cursiva
    .replace(/`(.+?)`/g, '$1')           // código inline
    .replace(/^[-*•]\s+/gm, '')          // bullets
    .replace(/^\d+\.\s+/gm, '')          // listas numeradas
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // links
    .replace(/\n{3,}/g, '\n\n')          // líneas extra
    .replace(/\|.+\|/g, '')             // tablas
    .trim();
}

// Divide el texto en frases para el resaltado
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?:])\s+|\n\n/)
    .map(s => s.trim())
    .filter(s => s.length > 2);
}

export default function RecipeReader({ text }: RecipeReaderProps) {
  const { isDark, locale } = useApp();

  const [supported, setSupported]   = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [paused, setPaused]         = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [sentences, setSentences]   = useState<string[]>([]);
  const [speed, setSpeed]           = useState(1);
  const [showSpeed, setShowSpeed]   = useState(false);

  const synthRef    = useRef<SpeechSynthesis | null>(null);
  const utterRef    = useRef<SpeechSynthesisUtterance | null>(null);
  const sentIdxRef  = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setSupported(true);
    }
  }, []);

  useEffect(() => {
    const clean = cleanForSpeech(text);
    setSentences(splitSentences(clean));
  }, [text]);

  // Cancelar al desmontar
  useEffect(() => () => { synthRef.current?.cancel(); }, []);

  const speakFrom = useCallback((fromIdx: number) => {
    const synth = synthRef.current;
    if (!synth || sentences.length === 0) return;

    synth.cancel();
    sentIdxRef.current = fromIdx;

    const speakNext = (idx: number) => {
      if (idx >= sentences.length) {
        setPlaying(false); setPaused(false); setCurrentIdx(-1);
        return;
      }
      setCurrentIdx(idx);
      sentIdxRef.current = idx;

      const utt = new SpeechSynthesisUtterance(sentences[idx]);
      utt.lang  = locale === 'es' ? 'es-ES' : 'en-US';
      utt.rate  = speed;
      utt.pitch = 1;

      // Elegir voz del idioma si está disponible
      const voices = synth.getVoices();
      const match  = voices.find(v => v.lang.startsWith(locale === 'es' ? 'es' : 'en'));
      if (match) utt.voice = match;

      utt.onend = () => {
        if (synthRef.current?.speaking === false) speakNext(idx + 1);
      };
      utt.onerror = () => speakNext(idx + 1);

      utterRef.current = utt;
      synth.speak(utt);
    };

    speakNext(fromIdx);
    setPlaying(true);
    setPaused(false);
  }, [sentences, locale, speed]);

  const handlePlay = () => {
    if (paused) {
      synthRef.current?.resume();
      setPaused(false);
      setPlaying(true);
    } else {
      speakFrom(0);
    }
  };

  const handlePause = () => {
    synthRef.current?.pause();
    setPaused(true);
    setPlaying(false);
  };

  const handleStop = () => {
    synthRef.current?.cancel();
    setPlaying(false); setPaused(false); setCurrentIdx(-1);
  };

  const handleSentenceClick = (idx: number) => speakFrom(idx);

  const changeSpeed = (s: number) => {
    setSpeed(s);
    setShowSpeed(false);
    if (playing || paused) {
      const fromIdx = sentIdxRef.current;
      setTimeout(() => speakFrom(fromIdx), 80);
    }
  };

  if (!supported) return null;

  const gold  = isDark ? '#f5c842' : '#8B6914';
  const goldBg = isDark ? 'bg-[#f5c842]/10 border-[#f5c842]/20' : 'bg-[#8B6914]/8 border-[#8B6914]/15';
  const goldText = isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]';
  const mutedText = isDark ? 'text-[#f5c842]/60' : 'text-[#8B6914]/60';

  const speeds = [0.75, 1, 1.25, 1.5];
  const speedLabels: Record<number, string> = { 0.75: '0.75×', 1: '1×', 1.25: '1.25×', 1.5: '1.5×' };

  return (
    <div className={`mt-4 rounded-xl border ${goldBg}`}>

      {/* Barra de controles */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <span className="text-base">🎙️</span>
        <span className={`text-xs font-semibold flex-1 ${goldText}`}>
          {locale === 'es' ? 'Leer receta en voz alta' : 'Read recipe aloud'}
        </span>

        {/* Velocidad */}
        <div className="relative">
          <button
            onClick={() => setShowSpeed(v => !v)}
            className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition-all ${goldText} ${isDark ? 'border-[#f5c842]/20 hover:bg-[#f5c842]/10' : 'border-[#8B6914]/20 hover:bg-[#8B6914]/8'}`}
          >
            {speedLabels[speed]}
          </button>
          <AnimatePresence>
            {showSpeed && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                className={`absolute right-0 bottom-9 z-50 rounded-xl border shadow-xl overflow-hidden min-w-[130px]
                  ${isDark ? 'bg-[#000c1f] border-[#f5c842]/25' : 'bg-white border-[#8B6914]/20 shadow-[#8B6914]/10'}`}
              >
                {speeds.map(s => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      speed === s
                        ? isDark ? 'bg-[#f5c842]/15 text-[#f5c842]' : 'bg-[#8B6914]/10 text-[#6b4f0a]'
                        : isDark ? 'text-white/70 hover:bg-[#f5c842]/8' : 'text-gray-700 hover:bg-[#8B6914]/5'
                    }`}
                  >
                    {speedLabels[s]} {s === 1 ? (locale === 'es' ? '· Normal' : '· Normal') : s < 1 ? (locale === 'es' ? '· Lento' : '· Slow') : (locale === 'es' ? '· Rápido' : '· Fast')}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Play / Pausa */}
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
          onClick={playing ? handlePause : handlePlay}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-sm shadow-sm ${
            isDark
              ? 'bg-[#f5c842] text-[#000810] hover:bg-[#ffd84d]'
              : 'bg-[#8B6914] text-white hover:bg-[#6b4f0a]'
          }`}
        >
          {playing ? '⏸' : '▶'}
        </motion.button>

        {/* Stop */}
        <AnimatePresence>
          {(playing || paused) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleStop}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs border transition-all ${
                isDark ? 'border-[#f5c842]/30 text-[#f5c842]/70 hover:bg-[#f5c842]/10' : 'border-[#8B6914]/25 text-[#8B6914]/70 hover:bg-[#8B6914]/8'
              }`}
            >
              ■
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de progreso */}
      {(playing || paused) && sentences.length > 0 && (
        <div className={`h-0.5 ${isDark ? 'bg-[#f5c842]/10' : 'bg-[#8B6914]/10'}`}>
          <motion.div
            className={`h-full ${isDark ? 'bg-[#f5c842]' : 'bg-[#8B6914]'}`}
            animate={{ width: `${((currentIdx + 1) / sentences.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Texto resaltado — solo visible mientras lee */}
      <AnimatePresence>
        {(playing || paused) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-3 pt-1 max-h-36 overflow-y-auto space-y-1 scrollbar-thin`}>
              {sentences.map((s, i) => (
                <motion.button
                  key={i}
                  onClick={() => handleSentenceClick(i)}
                  animate={{
                    opacity: i === currentIdx ? 1 : i < currentIdx ? 0.4 : 0.65,
                    scale: i === currentIdx ? 1.01 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className={`block text-left w-full text-xs leading-relaxed rounded-lg px-2 py-0.5 transition-all cursor-pointer ${
                    i === currentIdx
                      ? isDark
                        ? 'text-[#f5c842] font-semibold bg-[#f5c842]/10'
                        : 'text-[#6b4f0a] font-semibold bg-[#8B6914]/10'
                      : isDark ? 'text-white/60 hover:text-white/80' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {i === currentIdx && (
                    <span className="inline-flex items-center gap-1 mr-1">
                      {[0,1,2].map(n => (
                        <motion.span
                          key={n}
                          animate={{ scaleY: [1, 2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: n * 0.15 }}
                          className={`inline-block w-0.5 h-2 rounded-full ${isDark ? 'bg-[#f5c842]' : 'bg-[#8B6914]'}`}
                        />
                      ))}
                    </span>
                  )}
                  {s}
                </motion.button>
              ))}
            </div>
            <p className={`text-[10px] text-center pb-2 ${mutedText}`}>
              {locale === 'es' ? 'Toca una frase para saltar a ella' : 'Tap a sentence to jump to it'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
