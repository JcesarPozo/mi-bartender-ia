'use client';

import { motion } from 'framer-motion';

const DONATION_URL = 'https://pay.comun.app/u/julio_del_712';

interface DonationButtonProps {
  locale?: string;
  variant?: 'full' | 'compact' | 'inline';
  dark?: boolean; // forzar modo oscuro (para landing)
}

export default function DonationButton({
  locale = 'es',
  variant = 'full',
  dark = false,
}: DonationButtonProps) {
  const isEs = locale === 'es';

  const labels = {
    full: {
      title:   isEs ? '¿Te gustó el cóctel? 🍺' : 'Enjoying the cocktails? 🍺',
      sub:     isEs ? 'Invítame un trago y ayuda a mantener el bar abierto.' : 'Buy me a drink and help keep the bar open.',
      btn:     isEs ? '🥂 Invitar un trago' : '🥂 Buy me a drink',
    },
    compact: {
      btn: isEs ? '🥂 Invitar un trago' : '🥂 Buy me a drink',
    },
    inline: {
      btn: isEs ? '🥂 Apoya al bartender' : '🥂 Support the bartender',
    },
  };

  if (variant === 'compact') {
    return (
      <motion.a
        href={DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05, boxShadow: '0 0 24px rgba(245,200,66,0.25)' }}
        whileTap={{ scale: 0.96 }}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border
          ${dark
            ? 'border-[#f5c842]/30 text-[#f5c842] bg-[#f5c842]/8 hover:bg-[#f5c842]/15'
            : 'border-[#8B6914]/30 text-[#8B6914] bg-[#8B6914]/8 hover:bg-[#8B6914]/15'
          }`}
      >
        {labels.compact.btn}
      </motion.a>
    );
  }

  if (variant === 'inline') {
    return (
      <motion.a
        href={DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold
          border transition-all
          ${dark
            ? 'border-[#f5c842]/20 text-[#f5c842]/70 hover:border-[#f5c842]/45 hover:text-[#f5c842] hover:bg-[#f5c842]/5'
            : 'border-[#8B6914]/20 text-[#8B6914]/70 hover:border-[#8B6914]/45 hover:text-[#8B6914] hover:bg-[#8B6914]/5'
          }`}
      >
        {labels.inline.btn}
      </motion.a>
    );
  }

  // variant === 'full'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`rounded-2xl p-5 text-center border transition-all
        ${dark
          ? 'bg-[#f5c842]/5 border-[#f5c842]/15'
          : 'bg-[#8B6914]/5 border-[#8B6914]/15'
        }`}
    >
      <p className={`text-sm font-semibold mb-1 ${dark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
        {labels.full.title}
      </p>
      <p className={`text-xs mb-4 leading-relaxed ${dark ? 'text-[#f5c842]/55' : 'text-[#8B6914]/60'}`}>
        {labels.full.sub}
      </p>
      <motion.a
        href={DONATION_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(245,200,66,0.25)' }}
        whileTap={{ scale: 0.97 }}
        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all
          ${dark
            ? 'bg-gradient-to-r from-[#f5c842] to-[#d4a832] text-[#000510] shadow-lg shadow-[#f5c842]/20'
            : 'bg-gradient-to-r from-[#c9a227] to-[#8B6914] text-white shadow-lg shadow-[#8B6914]/15'
          }`}
      >
        {labels.full.btn}
      </motion.a>
    </motion.div>
  );
}
