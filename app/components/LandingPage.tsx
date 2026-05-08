'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onGetStarted: () => void;
}

// ── Cocktails de demo (sin API) ───────────────────────────────────────────────
const DEMO_COCKTAILS = [
  {
    name: 'Mojito Maracuyá',
    emoji: '🌴',
    color: '#1a4a2e',
    accent: '#4ade80',
    desc: 'Ron blanco, maracuyá fresco, menta, lima y soda. Tropical y vibrante.',
    tags: ['Tropical', 'Cítrico', 'Ron'],
    img: 'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
  },
  {
    name: 'Negroni Ahumado',
    emoji: '🔥',
    color: '#3a1a0a',
    accent: '#f97316',
    desc: 'Gin ahumado, Campari, vermut rojo. Intenso, sofisticado y memorable.',
    tags: ['Clásico', 'Amargo', 'Gin'],
    img: 'https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg',
  },
  {
    name: 'Blue Velvet',
    emoji: '💙',
    color: '#0a1a3a',
    accent: '#60a5fa',
    desc: 'Blue Curaçao, zumo de piña, agua tónica. Visualmente impactante.',
    tags: ['Tropical', 'Dulce', 'Licor'],
    img: 'https://www.thecocktaildb.com/images/media/drink/bry4qh1582751040.jpg',
  },
];

const FEATURES = [
  { icon: '🧠', title: 'IA que te entiende', desc: 'Describe tu estado de ánimo y la IA inventa el cóctel perfecto para ese momento.' },
  { icon: '🎨', title: 'Imagen generada al instante', desc: 'Cada cóctel se visualiza con IA. Ve exactamente cómo quedará antes de prepararlo.' },
  { icon: '📚', title: 'Catálogo personal', desc: 'Guarda, etiqueta y valora tus creaciones. Tu biblioteca privada de recetas únicas.' },
  { icon: '📤', title: 'Tarjeta para compartir', desc: 'Exporta una tarjeta premium lista para Instagram, WhatsApp o TikTok en un tap.' },
  { icon: '📄', title: 'Exportar en PDF', desc: 'Genera tu carta de cócteles en PDF elegante. Perfecto para eventos o bares.' },
  { icon: '🌍', title: 'Español e inglés', desc: 'Cambia de idioma en cualquier momento. Las recetas se generan en el idioma que elijas.' },
];

const STATS = [
  { value: '12.400+', label: 'Cócteles creados' },
  { value: '3.200+', label: 'Bartenders registrados' },
  { value: '4.8★', label: 'Valoración media' },
];

// ── Animaciones ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeDemo, setActiveDemo] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-avanzar demo
  useEffect(() => {
    const t = setInterval(() => setActiveDemo(p => (p + 1) % DEMO_COCKTAILS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const c = DEMO_COCKTAILS[activeDemo];

  return (
    <div className="min-h-screen bg-[#000810] text-white overflow-x-hidden">

      {/* ══ NAV ══════════════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#000810]/90 backdrop-blur-md border-b border-[#f5c842]/10' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🍸</span>
            <span className="font-serif text-lg font-bold text-[#f5c842] tracking-wide">Mi Bartender IA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {['Funcionalidades', 'Demo', 'Precios'].map(label => (
              <a key={label} href={`#${label.toLowerCase()}`}
                className="text-sm text-[#f5c842]/60 hover:text-[#f5c842] transition-colors">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onGetStarted}
              className="text-sm text-[#f5c842]/70 hover:text-[#f5c842] transition-colors px-3 py-1.5">
              Entrar
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="text-sm font-bold bg-[#f5c842] text-[#000810] px-4 py-2 rounded-xl hover:bg-[#e6b830] transition-colors">
              Empezar gratis
            </motion.button>
          </div>
        </div>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

        {/* Fondo: gradiente radial + grain */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,200,66,0.12),transparent)]" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '180px' }} />

        {/* Líneas decorativas */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#f5c842]/20 to-transparent ml-10 hidden lg:block" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#f5c842]/20 to-transparent mr-10 hidden lg:block" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-8xl md:text-9xl mb-8 inline-block"
          >
            🍸
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/50 mb-6 font-medium">
            Tu mixólogo personal con inteligencia artificial
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
            <span className="text-white">El cóctel perfecto</span>
            <br />
            <span className="text-[#f5c842]">existe. Solo hay</span>
            <br />
            <span className="text-white">que inventarlo.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe cómo te sientes, qué ocasión es o qué ingredientes tienes. La IA crea una receta única, genera la imagen y la guarda en tu catálogo personal.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(245,200,66,0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-[#f5c842] text-[#000810] font-bold text-base rounded-2xl hover:bg-[#e6b830] transition-colors">
              Crear mi primer cóctel gratis →
            </motion.button>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 border border-[#f5c842]/25 text-[#f5c842]/80 font-medium text-base rounded-2xl hover:border-[#f5c842]/50 hover:text-[#f5c842] transition-colors">
              Ver ejemplos ↓
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex items-center justify-center gap-10 mt-16 pt-10 border-t border-[#f5c842]/10">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="font-serif text-2xl font-bold text-[#f5c842]">{s.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 border border-[#f5c842]/30 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-[#f5c842]/60 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══ CÓMO FUNCIONA ════════════════════════════════════════════════════ */}
      <section id="funcionalidades" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger} className="text-center mb-20">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] uppercase text-[#f5c842]/50 mb-4">Así de simple</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-bold text-white">
              De la idea al vaso<br /><span className="text-[#f5c842]">en 10 segundos</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#f5c842]/10 rounded-2xl overflow-hidden">
            {[
              { n: '01', title: 'Describe', desc: 'Escribe lo que quieres: "algo tropical para una fiesta", "clásico sin alcohol", o el mood del momento.', icon: '💬' },
              { n: '02', title: 'La IA inventa', desc: 'En segundos recibes una receta única con ingredientes, proporciones, técnica y maridaje sugerido.', icon: '✨' },
              { n: '03', title: 'Guarda y comparte', desc: 'El cóctel se guarda en tu catálogo con su imagen generada por IA. Compártelo en redes con un tap.', icon: '🚀' },
            ].map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="bg-[#000c1f] p-10 flex flex-col gap-4">
                <span className="text-4xl">{step.icon}</span>
                <span className="font-serif text-[#f5c842]/40 text-5xl font-bold leading-none">{step.n}</span>
                <h3 className="font-serif text-2xl font-bold text-white">{step.title}</h3>
                <p className="text-white/55 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DEMO ═════════════════════════════════════════════════════════════ */}
      <section id="demo" className="py-24 px-6 bg-[#000c1f]/60">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] uppercase text-[#f5c842]/50 mb-4">Ejemplos reales</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-bold">
              Cada receta,<br /><span className="text-[#f5c842]">única como tú</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Tabs */}
            <div className="flex flex-col gap-3">
              {DEMO_COCKTAILS.map((cocktail, i) => (
                <motion.button key={cocktail.name}
                  onClick={() => setActiveDemo(i)}
                  whileHover={{ x: 4 }}
                  className={`text-left p-5 rounded-xl border transition-all duration-300 ${
                    activeDemo === i
                      ? 'border-[#f5c842]/50 bg-[#f5c842]/8'
                      : 'border-[#f5c842]/10 hover:border-[#f5c842]/25'
                  }`}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">{cocktail.emoji}</span>
                    <span className={`font-serif font-bold text-lg ${activeDemo === i ? 'text-[#f5c842]' : 'text-white/80'}`}>
                      {cocktail.name}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 ml-9">{cocktail.desc}</p>
                  <div className="flex gap-2 mt-2.5 ml-9">
                    {cocktail.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-[#f5c842]/15 text-[#f5c842]/50">
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Imagen animada */}
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-[#f5c842]/15">
              <AnimatePresence mode="wait">
                <motion.img
                  key={c.img}
                  src={c.img}
                  alt={c.name}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/default-cocktail.jpg'; }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-[#000810]/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <AnimatePresence mode="wait">
                  <motion.div key={c.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}>
                    <p className="font-serif text-2xl font-bold text-[#f5c842]">{c.name}</p>
                    <p className="text-sm text-white/60 mt-0.5">Generado con IA · Imagen exclusiva</p>
                  </motion.div>
                </AnimatePresence>
              </div>
              {/* Badge IA */}
              <div className="absolute top-4 right-4 bg-[#000810]/80 backdrop-blur-sm border border-[#f5c842]/25 rounded-lg px-3 py-1.5">
                <p className="text-[11px] text-[#f5c842] font-medium">✨ Generado por IA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] uppercase text-[#f5c842]/50 mb-4">Todo incluido</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-bold">
              No es solo una receta.<br /><span className="text-[#f5c842]">Es una experiencia.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                whileHover={{ y: -4, borderColor: 'rgba(245,200,66,0.3)' }}
                className="p-6 border border-[#f5c842]/10 rounded-2xl bg-[#000c1f]/50 transition-all duration-300">
                <span className="text-3xl block mb-4">{f.icon}</span>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ PRICING ══════════════════════════════════════════════════════════ */}
      <section id="precios" className="py-32 px-6 bg-[#000c1f]/60">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.3em] uppercase text-[#f5c842]/50 mb-4">Precios</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-5xl font-bold">
              Empieza gratis.<br /><span className="text-[#f5c842]">Crece sin límites.</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="p-8 border border-[#f5c842]/15 rounded-2xl bg-[#000810]">
              <p className="text-xs tracking-[0.2em] uppercase text-white/40 mb-2">Free</p>
              <p className="font-serif text-4xl font-bold text-white mb-1">$0</p>
              <p className="text-sm text-white/40 mb-8">Para siempre</p>
              <ul className="space-y-3 mb-8">
                {[
                  '5 cócteles guardados',
                  '3 consultas por día',
                  'Imagen IA por cóctel',
                  'Catálogo personal',
                  'Tarjeta para compartir',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <span className="text-[#f5c842]/60">✓</span> {f}
                  </li>
                ))}
                {[
                  'Chat conversacional Pro',
                  'Exportar catálogo en PDF',
                  'Recetas extendidas con IA',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/30 line-through">
                    <span className="text-white/20">✕</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted}
                className="w-full py-3.5 border border-[#f5c842]/25 text-[#f5c842]/70 rounded-xl font-medium hover:border-[#f5c842]/50 hover:text-[#f5c842] transition-colors">
                Empezar gratis
              </button>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.6 }}
              className="p-8 border border-[#f5c842]/50 rounded-2xl bg-[#f5c842]/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-[#f5c842] text-[#000810] text-[10px] font-bold px-2.5 py-1 rounded-full">
                MÁS POPULAR
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-[#f5c842]/60 mb-2">Pro</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <p className="font-serif text-4xl font-bold text-[#f5c842]">$9.99</p>
                <p className="text-sm text-[#f5c842]/50">/mes</p>
              </div>
              <p className="text-sm text-white/40 mb-8">Cancela cuando quieras</p>
              <ul className="space-y-3 mb-8">
                {[
                  'Cócteles ilimitados',
                  'Consultas ilimitadas',
                  'Chat conversacional con memoria',
                  'Recetas con IA de alta calidad',
                  'Exportar catálogo en PDF',
                  'Imagen IA mejorada',
                  'Tarjeta para compartir',
                  'Soporte prioritario',
                ].map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                    <span className="text-[#f5c842]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(245,200,66,0.25)' }}
                whileTap={{ scale: 0.98 }}
                onClick={onGetStarted}
                className="w-full py-3.5 bg-[#f5c842] text-[#000810] rounded-xl font-bold hover:bg-[#e6b830] transition-colors">
                Empezar con Pro →
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(245,200,66,0.08),transparent)]" />
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={stagger} className="relative z-10 max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="text-7xl mb-8">🍸</motion.div>
          <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold mb-6">
            Tu primer cóctel<br /><span className="text-[#f5c842]">te espera.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-white/55 mb-10 leading-relaxed">
            Únete a más de 3.000 bartenders que ya están creando recetas únicas.<br />Sin tarjeta de crédito. Sin compromisos.
          </motion.p>
          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.04, boxShadow: '0 0 60px rgba(245,200,66,0.3)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-10 py-5 bg-[#f5c842] text-[#000810] font-bold text-lg rounded-2xl hover:bg-[#e6b830] transition-colors">
            Crear cuenta gratis →
          </motion.button>
          <motion.p variants={fadeUp} className="text-xs text-white/30 mt-5">
            Plan gratuito para siempre · Sin tarjeta de crédito
          </motion.p>
        </motion.div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#f5c842]/10 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🍸</span>
            <span className="font-serif text-[#f5c842] font-bold">Mi Bartender IA</span>
          </div>
          <p className="text-xs text-white/30 italic text-center">
            &ldquo;Beber es una necesidad, pero saber beber es un Arte.&rdquo;
          </p>
          <div className="flex items-center gap-4">
            <img src="/logo-borrachos.jpg" alt="Borrach@s y más" className="h-8 rounded-lg opacity-60" />
            <p className="text-xs text-white/25">© 2026 Borrach@s y más</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
