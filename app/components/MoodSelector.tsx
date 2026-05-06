'use client';

import { motion } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';

interface MoodSelectorProps {
  selectedMood: string | null;
  onSelect: (prompt: string, moodId: string) => void;
}

export default function MoodSelector({ selectedMood, onSelect }: MoodSelectorProps) {
  const { t, tc, isDark } = useApp();
  const moods = t.app.moods;

  return (
    <div className="mb-5">
      <p className={`text-xs font-medium mb-3 tracking-wide uppercase ${tc.textFaint}`}>
        {t.app.moodLabel}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {moods.map((mood, i) => {
          const isSelected = selectedMood === mood.id;
          return (
            <motion.button
              key={mood.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(mood.prompt, isSelected ? '' : mood.id)}
              className={`
                relative flex flex-col items-center gap-1.5 px-2 py-3
                rounded-xl border text-center transition-all duration-200
                ${isSelected
                  ? isDark
                    ? 'border-[#f5c842] bg-[#f5c842]/15 shadow-md shadow-[#f5c842]/15'
                    : 'border-[#8B6914] bg-[#8B6914]/12 shadow-md shadow-[#8B6914]/10'
                  : isDark
                    ? 'border-[#f5c842]/12 bg-white/3 hover:border-[#f5c842]/35 hover:bg-[#f5c842]/8'
                    : 'border-[#8B6914]/15 bg-white/60 hover:border-[#8B6914]/40 hover:bg-white/90'
                }
              `}
            >
              {/* Indicador activo */}
              {isSelected && (
                <motion.div
                  layoutId="mood-active"
                  className={`absolute inset-0 rounded-xl ${
                    isDark ? 'bg-[#f5c842]/8' : 'bg-[#8B6914]/8'
                  }`}
                />
              )}

              <span className="text-xl relative z-10">{mood.emoji}</span>
              <span className={`text-xs font-semibold leading-tight relative z-10 ${
                isSelected
                  ? isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'
                  : tc.textMuted
              }`}>
                {mood.label}
              </span>

              {/* Check si está seleccionado */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isDark ? 'bg-[#f5c842] text-[#000308]' : 'bg-[#8B6914] text-white'
                  }`}
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
