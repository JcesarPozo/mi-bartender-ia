'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';
import { PLANS } from '@/lib/plans';

interface PricingModalProps {
  onClose: () => void;
  onUpgrade: () => void;
  upgrading: boolean;
  limitReached?: boolean;
}

export default function PricingModal({ onClose, onUpgrade, upgrading, limitReached }: PricingModalProps) {
  const { isDark, locale, tc } = useApp();
  const free    = PLANS.free;
  const premium = PLANS.premium;

  const gold  = isDark ? '#f5c842' : '#8B6914';
  const goldBg = isDark ? 'bg-[#f5c842]/10 border-[#f5c842]/30' : 'bg-[#8B6914]/8 border-[#8B6914]/25';

  const features = locale === 'es' ? [
    { free: '5 cócteles / día',           premium: 'Ilimitados ♾️',           icon: '🍹' },
    { free: 'Catálogo máx. 20',           premium: 'Catálogo ilimitado',        icon: '📚' },
    { free: '—',                           premium: '🍸 Bartender Pro (chat)',   icon: '🤖' },
    { free: '—',                           premium: 'Regenerar imagen 🎲',       icon: '🎨' },
    { free: '—',                           premium: 'Compartir tarjeta 📤',      icon: '📤' },
    { free: 'Imagen IA',                   premium: 'Imagen IA HD',              icon: '📸' },
  ] : [
    { free: '5 cocktails / day',          premium: 'Unlimited ♾️',             icon: '🍹' },
    { free: 'Catalog max. 20',            premium: 'Unlimited catalog',          icon: '📚' },
    { free: '—',                           premium: '🍸 Pro Bartender (chat)',   icon: '🤖' },
    { free: '—',                           premium: 'Regenerate image 🎲',       icon: '🎨' },
    { free: '—',                           premium: 'Share card 📤',             icon: '📤' },
    { free: 'AI image',                   premium: 'AI image HD',                icon: '📸' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl
            ${isDark ? 'bg-[#000510] border border-[#f5c842]/20' : 'bg-white border border-[#8B6914]/20'}`}
        >
          {/* Header */}
          <div className={`px-6 py-5 text-center border-b ${isDark ? 'border-[#f5c842]/10 bg-[#f5c842]/5' : 'border-[#8B6914]/10 bg-[#8B6914]/4'}`}>
            <div className="text-4xl mb-2">🥂</div>
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
              {locale === 'es' ? 'Hazte Premium' : 'Go Premium'}
            </h2>
            {limitReached && (
              <p className={`text-sm mt-1 ${isDark ? 'text-[#f5c842]/70' : 'text-[#8B6914]/70'}`}>
                {locale === 'es'
                  ? '⚠️ Has alcanzado el límite diario del plan gratuito'
                  : '⚠️ You\'ve reached the daily free plan limit'}
              </p>
            )}
          </div>

          {/* Tabla comparativa */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-bold text-center">
              <div className={isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/50'}></div>
              <div className={isDark ? 'text-[#f5c842]/60' : 'text-[#8B6914]/60'}>
                {free.emoji} {locale === 'es' ? free.name : free.nameEn}
              </div>
              <div className={`${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'} font-extrabold`}>
                {premium.emoji} {locale === 'es' ? premium.name : premium.nameEn}
              </div>
            </div>

            <div className="space-y-2">
              {features.map((f, i) => (
                <div key={i} className={`grid grid-cols-3 gap-2 items-center py-2 px-3 rounded-lg text-xs
                  ${i % 2 === 0
                    ? isDark ? 'bg-[#f5c842]/4' : 'bg-[#8B6914]/4'
                    : ''}`}>
                  <div className={`font-medium ${isDark ? 'text-[#f5c842]/60' : 'text-[#4a3a0a]'}`}>{f.icon}</div>
                  <div className={`text-center ${isDark ? 'text-[#f5c842]/50' : 'text-[#4a3a0a]/70'}`}>
                    {f.free === '—' ? <span className="opacity-30">—</span> : f.free}
                  </div>
                  <div className={`text-center font-semibold ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
                    {f.premium}
                  </div>
                </div>
              ))}
            </div>

            {/* Precio */}
            <div className={`mt-6 rounded-xl p-4 text-center border ${goldBg}`}>
              <div className={`text-3xl font-bold font-serif ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
                9.99 USD
                <span className={`text-base font-normal ml-1 ${isDark ? 'text-[#f5c842]/60' : 'text-[#8B6914]/60'}`}>
                  / {locale === 'es' ? 'mes' : 'month'}
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/50'}`}>
                {locale === 'es' ? 'Cancela cuando quieras' : 'Cancel anytime'}
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-5">
              <button onClick={onClose}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all
                  ${isDark ? 'border-[#f5c842]/20 text-[#f5c842]/60 hover:border-[#f5c842]/40' : 'border-[#8B6914]/20 text-[#8B6914]/60 hover:border-[#8B6914]/40'}`}>
                {locale === 'es' ? 'Ahora no' : 'Not now'}
              </button>
              <motion.button
                onClick={onUpgrade} disabled={upgrading}
                whileHover={{ scale: upgrading ? 1 : 1.02 }}
                whileTap={{ scale: upgrading ? 1 : 0.97 }}
                className={`flex-2 flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60
                  ${isDark
                    ? 'bg-gradient-to-r from-[#f5c842] to-[#d4a832] text-[#000510] shadow-lg shadow-[#f5c842]/20'
                    : 'bg-gradient-to-r from-[#c9a227] to-[#8B6914] text-white shadow-lg shadow-[#8B6914]/20'}`}>
                {upgrading
                  ? (locale === 'es' ? 'Redirigiendo...' : 'Redirecting...')
                  : (locale === 'es' ? '🥂 Ir a Premium' : '🥂 Upgrade to Premium')}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
