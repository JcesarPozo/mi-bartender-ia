'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';
import { ALL_TAGS, getTagById, type Tag } from '@/lib/autoTags';

interface TagFilterProps {
  availableTags: string[];   // ids de tags presentes en el catálogo
  activeFilter: string | null;
  onFilter: (tagId: string | null) => void;
}

export default function TagFilter({ availableTags, activeFilter, onFilter }: TagFilterProps) {
  const { isDark, locale } = useApp();

  if (availableTags.length === 0) return null;

  const tags = availableTags
    .map((id) => getTagById(id))
    .filter(Boolean) as Tag[];

  const accentActive = isDark
    ? 'border-[#f5c842] bg-[#f5c842]/20 text-[#f5c842] shadow-sm shadow-[#f5c842]/20'
    : 'border-[#8B6914] bg-[#8B6914]/15 text-[#6b4f0a] shadow-sm shadow-[#8B6914]/10';

  const accentIdle = isDark
    ? 'border-[#f5c842]/15 text-[#f5c842]/60 hover:border-[#f5c842]/40 hover:text-[#f5c842]'
    : 'border-[#8B6914]/15 text-[#8B6914]/60 hover:border-[#8B6914]/40 hover:text-[#8B6914]';

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-1.5">
        {/* Botón "Todos" */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.93 }}
          onClick={() => onFilter(null)}
          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
            activeFilter === null ? accentActive : accentIdle
          }`}
        >
          {locale === 'es' ? '✦ Todos' : '✦ All'}
        </motion.button>

        {/* Tags disponibles */}
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.button
              key={tag.id}
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onFilter(activeFilter === tag.id ? null : tag.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                activeFilter === tag.id ? accentActive : accentIdle
              }`}
            >
              <span>{tag.emoji}</span>
              <span>{locale === 'es' ? tag.label : tag.labelEn}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
