'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DONATION_URL = 'https://pay.comun.app/u/julio_del_712';

interface DonationButtonProps {
  locale?: string;
  variant?: 'full' | 'compact' | 'inline';
  dark?: boolean;
}

// ── Modal explicativo ──────────────────────────────────────────────────────────
function DonationModal({ locale, dark, onClose }: { locale: string; dark: boolean; onClose: () => void }) {
  const isEs = locale === 'es';

  const points = isEs ? [
    { emoji: '🎁', text: 'Esta app es **completamente gratuita** ahora y siempre. No hay trampa ni letra pequeña.' },
    { emoji: '❤️', text: 'La donación es **100% voluntaria**. Sin mínimo, sin suscripción, sin obligación de ningún tipo.' },
    { emoji: '☕', text: 'Si donas **el precio de un café** ya me ayudas enormemente a pagar los servidores y la IA.' },
    { emoji: '🚀', text: 'Con tu apoyo puedo **seguir mejorando** la app y mantenerla gratuita para todos.' },
    { emoji: '🙌', text: '**Si no quieres donar, perfecto.** Cierra esto y sigue disfrutando sin ningún problema.' },
  ] : [
    { emoji: '🎁', text: 'This app is **completely free** now and always. No hidden fees, no tricks.' },
    { emoji: '❤️', text: 'Donations are **100% voluntary**. No minimum, no subscription, no obligation whatsoever.' },
    { emoji: '☕', text: '**The price of a coffee** already helps me a lot to cover servers and AI costs.' },
    { emoji: '🚀', text: 'Your support helps me **keep improving** the app and keep it free for everyone.' },
    { emoji: '🙌', text: '**If you don\'t want to donate, that\'s totally fine.** Close this and keep enjoying the app.' },
  ];

  const handleDonate = () => { window.open(DONATION_URL, '_blank', 'noopener,noreferrer'); onClose(); };

  const gold = dark ? 'text-[#f5c842]' : 'text-[#6b4f0a]';
  const goldBold = dark ? 'text-[#f5c842] font-bold' : 'text-[#6b4f0a] font-bold';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl
          ${dark ? 'bg-[#000810] border border-[#f5c842]/25' : 'bg-white border border-[#8B6914]/20'}`}
      >
        {/* Header con badge "sin coste" */}
        <div className={`px-6 pt-6 pb-4 border-b ${dark ? 'border-[#f5c842]/10' : 'border-[#8B6914]/10'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {/* Badge prominente */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3
                ${dark ? 'bg-[#f5c842]/15 text-[#f5c842] border border-[#f5c842]/30'
                       : 'bg-[#8B6914]/10 text-[#6b4f0a] border border-[#8B6914]/25'}`}>
                ✅ {isEs ? '100% voluntario · Sin coste · Sin mínimo' : '100% voluntary · Free · No minimum'}
              </div>
              <h2 className={`text-xl font-bold font-serif ${gold}`}>
                {isEs ? '🥂 ¿Quieres invitarme un trago?' : '🥂 Want to buy me a drink?'}
              </h2>
              <p className={`text-xs mt-1.5 leading-relaxed ${dark ? 'text-[#f5c842]/55' : 'text-[#8B6914]/55'}`}>
                {isEs
                  ? 'Lee esto antes — quiero que entiendas exactamente qué estás a punto de hacer:'
                  : 'Read this first — I want you to understand exactly what you\'re about to do:'}
              </p>
            </div>
            <button onClick={onClose}
              className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm transition-colors
                ${dark ? 'text-[#f5c842]/40 hover:bg-[#f5c842]/10' : 'text-[#8B6914]/40 hover:bg-[#8B6914]/8'}`}>
              ✕
            </button>
          </div>
        </div>

        {/* Puntos explicativos */}
        <div className="px-6 py-5 space-y-3.5">
          {points.map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 + i * 0.07 }}
              className="flex items-start gap-3"
            >
              <span className="text-xl shrink-0">{p.emoji}</span>
              <p className={`text-sm leading-relaxed ${dark ? 'text-[#f5c842]/80' : 'text-[#2a1800]'}`}
                dangerouslySetInnerHTML={{
                  __html: p.text.replace(/\*\*(.+?)\*\*/g,
                    `<strong class="${goldBold}">$1</strong>`)
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Separador con mensaje clave */}
        <div className={`mx-6 py-3 px-4 rounded-xl mb-4 text-center text-xs leading-relaxed
          ${dark ? 'bg-[#f5c842]/8 text-[#f5c842]/70 border border-[#f5c842]/15'
                 : 'bg-[#8B6914]/6 text-[#6b4f0a]/70 border border-[#8B6914]/15'}`}>
          {isEs
            ? '⚠️ Al hacer clic en el botón de abajo solo se abre la página de donación. Tú decides si donas, cuánto, y puedes cerrarla sin hacer nada.'
            : '⚠️ Clicking the button below only opens the donation page. You decide whether to donate, how much, and you can close it without doing anything.'}
        </div>

        {/* Botones */}
        <div className="px-6 pb-6 space-y-3">
          <motion.button onClick={handleDonate}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(245,200,66,0.25)' }}
            whileTap={{ scale: 0.97 }}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-0.5
              ${dark
                ? 'bg-gradient-to-r from-[#f5c842] to-[#d4a832] text-[#000510] shadow-lg shadow-[#f5c842]/20'
                : 'bg-gradient-to-r from-[#c9a227] to-[#8B6914] text-white shadow-lg shadow-[#8B6914]/15'}`}>
            <span>{isEs ? '🍺 Sí, ver la página de donación' : '🍺 Yes, open the donation page'}</span>
            <span className="text-[10px] font-normal opacity-70">
              {isEs ? '(puedes cerrarla si cambias de opinión)' : '(you can close it if you change your mind)'}
            </span>
          </motion.button>

          <button onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all
              ${dark ? 'text-[#f5c842]/45 hover:text-[#f5c842]/70' : 'text-[#8B6914]/45 hover:text-[#8B6914]/70'}`}>
            {isEs ? '🙅 No gracias, seguir usando la app gratis' : '🙅 No thanks, keep using the app for free'}
          </button>

          <p className={`text-[10px] text-center leading-relaxed ${dark ? 'text-[#f5c842]/20' : 'text-[#8B6914]/30'}`}>
            🔒 {isEs
              ? 'Serás redirigido a comun.app · Plataforma segura de pagos · Nunca almacenamos tu tarjeta'
              : 'You\'ll be redirected to comun.app · Secure payment platform · We never store your card'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Botón principal ────────────────────────────────────────────────────────────
export default function DonationButton({ locale = 'es', variant = 'full', dark = false }: DonationButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const isEs = locale === 'es';

  const openModal = () => setShowModal(true);

  const borderCls = dark
    ? 'border-[#f5c842]/25 text-[#f5c842] hover:bg-[#f5c842]/10'
    : 'border-[#8B6914]/25 text-[#8B6914] hover:bg-[#8B6914]/8';

  return (
    <>
      <AnimatePresence>
        {showModal && (
          <DonationModal locale={locale} dark={dark} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>

      {/* ── Variante COMPACT ── */}
      {variant === 'compact' && (
        <div className="flex flex-col items-start gap-0.5">
          <motion.button onClick={openModal}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all
              bg-transparent ${borderCls}`}>
            🥂 {isEs ? 'Invitar un trago' : 'Buy me a drink'}
          </motion.button>
          <p className={`text-[10px] pl-1 ${dark ? 'text-[#f5c842]/35' : 'text-[#8B6914]/40'}`}>
            {isEs ? 'Donación voluntaria · sin mínimo · puedes cerrar sin pagar' : 'Voluntary donation · no minimum · close anytime'}
          </p>
        </div>
      )}

      {/* ── Variante INLINE ── */}
      {variant === 'inline' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-4 space-y-1"
        >
          <motion.button onClick={openModal}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold
              border transition-all ${borderCls}`}>
            🥂 {isEs ? 'Apoya al bartender (voluntario, sin mínimo)' : 'Support the bartender (voluntary, no minimum)'}
          </motion.button>
          <p className={`text-[10px] text-center ${dark ? 'text-[#f5c842]/25' : 'text-[#8B6914]/30'}`}>
            {isEs
              ? '¿No quieres? Sin problema — la app siempre será gratis 🎁'
              : 'Don\'t want to? No problem — the app is always free 🎁'}
          </p>
        </motion.div>
      )}

      {/* ── Variante FULL ── */}
      {variant === 'full' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className={`rounded-2xl overflow-hidden border transition-all
            ${dark ? 'bg-[#f5c842]/5 border-[#f5c842]/15' : 'bg-[#8B6914]/5 border-[#8B6914]/15'}`}
        >
          {/* Badge "gratis para siempre" */}
          <div className={`px-5 pt-4 flex items-center gap-2`}>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full
              ${dark ? 'bg-[#f5c842]/15 text-[#f5c842] border border-[#f5c842]/20'
                     : 'bg-[#8B6914]/10 text-[#6b4f0a] border border-[#8B6914]/15'}`}>
              🎁 {isEs ? 'App 100% gratuita para siempre' : 'App 100% free forever'}
            </span>
          </div>

          <div className="px-5 py-4 text-center">
            <p className={`text-sm font-semibold mb-1 ${dark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
              {isEs ? '¿Te está gustando el bartender? 🍸' : 'Enjoying the AI bartender? 🍸'}
            </p>
            <p className={`text-xs mb-1 leading-relaxed ${dark ? 'text-[#f5c842]/60' : 'text-[#8B6914]/65'}`}>
              {isEs
                ? 'Si quieres, puedes invitarme un trago virtual. Es completamente voluntario y sin ningún mínimo — cualquier cantidad ayuda a mantener esto gratis.'
                : 'If you\'d like, you can buy me a virtual drink. It\'s completely voluntary with no minimum — any amount helps keep this free.'}
            </p>
            <p className={`text-[10px] mb-4 ${dark ? 'text-[#f5c842]/35' : 'text-[#8B6914]/40'}`}>
              {isEs
                ? '👇 Al hacer clic verás los detalles antes de ir a ningún pago.'
                : '👇 Clicking will show you all the details before any payment.'}
            </p>
            <motion.button onClick={openModal}
              whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(245,200,66,0.25)' }}
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all
                ${dark
                  ? 'bg-gradient-to-r from-[#f5c842] to-[#d4a832] text-[#000510] shadow-lg shadow-[#f5c842]/20'
                  : 'bg-gradient-to-r from-[#c9a227] to-[#8B6914] text-white shadow-lg shadow-[#8B6914]/15'}`}>
              🥂 {isEs ? 'Quiero ver cómo apoyar' : 'I want to see how to support'}
            </motion.button>
            <p className={`text-[10px] mt-2 ${dark ? 'text-[#f5c842]/25' : 'text-[#8B6914]/30'}`}>
              {isEs ? 'Sin obligación · Puedes cerrar sin pagar' : 'No obligation · You can close without paying'}
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}
