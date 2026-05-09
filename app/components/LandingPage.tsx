'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onGetStarted: () => void;
}

// ── Datos ─────────────────────────────────────────────────────────────────────

const DEMO_COCKTAILS = [
  {
    name: 'Mojito Maracuyá',
    emoji: '🌴',
    desc: 'Ron blanco, maracuyá fresco, menta, lima y soda. Tropical y vibrante.',
    tags: ['Tropical', 'Cítrico', 'Ron'],
    img: 'https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg',
  },
  {
    name: 'Negroni Ahumado',
    emoji: '🔥',
    desc: 'Gin ahumado, Campari, vermut rojo. Intenso, sofisticado y memorable.',
    tags: ['Clásico', 'Amargo', 'Gin'],
    img: 'https://www.thecocktaildb.com/images/media/drink/qgdu971561574065.jpg',
  },
  {
    name: 'Blue Velvet',
    emoji: '💙',
    desc: 'Blue Curaçao, zumo de piña, agua tónica. Visualmente impactante.',
    tags: ['Tropical', 'Dulce', 'Licor'],
    img: 'https://www.thecocktaildb.com/images/media/drink/bry4qh1582751040.jpg',
  },
];

const MOODS = [
  { id: 'romantic',  emoji: '💑', label: 'Romántico',   desc: 'Para noches que importan' },
  { id: 'party',     emoji: '🎉', label: 'Fiesta',      desc: 'Cuando la noche pide más' },
  { id: 'chill',     emoji: '🌅', label: 'Relajado',    desc: 'El silencio también vibra' },
  { id: 'noalcohol', emoji: '🌿', label: 'Sin alcohol', desc: 'Sin límites, con sabor' },
  { id: 'tropical',  emoji: '🌴', label: 'Tropical',    desc: 'Lleva el verano contigo' },
  { id: 'classic',   emoji: '🎩', label: 'Clásico',     desc: 'El tiempo le da la razón' },
];

const TESTIMONIALS = [
  {
    quote: 'Le pedí "algo para una noche de verano con la persona que me gusta" y me dio la receta más perfecta que he probado en mi vida.',
    author: 'Elena M.',
    cocktail: 'Rosa de Medianoche',
    avatar: '🌹',
  },
  {
    quote: 'Organicé una cena para 12 personas y cada uno pidió su cóctel personalizado. Todos fliparon. Nadie se creyó que lo había hecho yo solo.',
    author: 'Carlos R.',
    cocktail: 'Velvet Storm',
    avatar: '🍾',
  },
  {
    quote: 'Soy bartender profesional y lo uso para inspirarme. Las combinaciones que propone son originales de verdad, no las típicas de siempre.',
    author: 'Sofía K.',
    cocktail: 'Obsidian Sour',
    avatar: '🥂',
  },
];

const FEATURES = [
  { icon: '🧠', title: 'IA que te entiende', desc: 'Describe el momento, el estado de ánimo, los ingredientes que tienes. La IA lee entre líneas.' },
  { icon: '🎨', title: 'Imagen generada al instante', desc: 'Cada receta llega con su imagen creada por IA. Ve exactamente cómo lucirá tu cóctel.' },
  { icon: '📚', title: 'Tu catálogo privado', desc: 'Guarda, etiqueta y valora cada creación. Una biblioteca de recetas que nadie más tiene.' },
  { icon: '📤', title: 'Tarjeta para compartir', desc: 'Genera una tarjeta visual lista para Instagram, WhatsApp o TikTok. Un tap y vuela.' },
  { icon: '📄', title: 'Exporta tu carta', desc: 'Convierte tu catálogo en un PDF elegante. Para eventos, cenas o tu bar personal.' },
  { icon: '🌍', title: 'Español e inglés', desc: 'Todas las recetas en el idioma que prefieras. Cambia en cualquier momento.' },
];

const TICKER_ITEMS = [
  'Espresso Martini', 'Paloma de Hibisco', 'Negroni Blanco', 'Mojito de Fresa',
  'Dark & Stormy', 'Clover Club', 'Velvet Sour', 'Midnight Rose',
  'Jungle Bird', 'Paper Plane', 'Last Word', 'Aperol Twist',
  'Frozen Margarita', 'Amaretto Dreams', 'Blue Lagoon', 'Golden Hour',
];

// ── Animaciones ───────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as any },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } },
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [scrolled, setScrolled]     = useState(false);
  const [activeDemo, setActiveDemo] = useState(0);
  const [activeMood, setActiveMood] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 130]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveDemo(p => (p + 1) % DEMO_COCKTAILS.length), 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveMood(p => (p + 1) % MOODS.length), 2600);
    return () => clearInterval(t);
  }, []);

  const c = DEMO_COCKTAILS[activeDemo];

  return (
    <div className="min-h-screen bg-[#000810] text-white overflow-x-hidden selection:bg-[#f5c842]/30">

      {/* ════ NAV ════════════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-[#000810]/85 backdrop-blur-xl border-b border-[#f5c842]/8' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.span
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
              className="text-2xl inline-block">🍸</motion.span>
            <span className="font-serif text-lg font-bold text-[#f5c842] tracking-wide">Mi Bartender IA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {[['Experiencia', '#experiencia'], ['Creaciones', '#demo'], ['Bartenders', '#bartenders']].map(([label, href]) => (
              <a key={label} href={href}
                className="text-sm text-[#f5c842]/55 hover:text-[#f5c842] transition-colors duration-200 tracking-wide">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onGetStarted}
              className="text-sm text-[#f5c842]/65 hover:text-[#f5c842] transition-colors px-3 py-1.5 tracking-wide">
              Entrar
            </button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(245,200,66,0.25)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="text-sm font-bold bg-[#f5c842] text-[#000810] px-5 py-2 rounded-xl hover:bg-[#ffd84d] transition-colors">
              Crear cóctel
            </motion.button>
          </div>
        </div>
      </header>

      {/* ════ HERO ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

        {/* Gradientes de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-5%,rgba(245,200,66,0.11),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(245,200,66,0.04),transparent)]" />

        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 512 512\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />

        {/* Líneas Art Deco laterales */}
        <div className="absolute left-8 top-24 bottom-24 w-px bg-gradient-to-b from-transparent via-[#f5c842]/18 to-transparent hidden lg:block" />
        <div className="absolute right-8 top-24 bottom-24 w-px bg-gradient-to-b from-transparent via-[#f5c842]/18 to-transparent hidden lg:block" />
        <div className="absolute left-10 top-24 bottom-24 w-px bg-gradient-to-b from-transparent via-[#f5c842]/6 to-transparent hidden lg:block" />
        <div className="absolute right-10 top-24 bottom-24 w-px bg-gradient-to-b from-transparent via-[#f5c842]/6 to-transparent hidden lg:block" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center px-6 max-w-5xl mx-auto">

          {/* Icono */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-8xl md:text-[9rem] mb-10 inline-block filter drop-shadow-[0_0_60px_rgba(245,200,66,0.3)]">
            🍸
          </motion.div>

          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.1em' }}
            animate={{ opacity: 1, letterSpacing: '0.35em' }}
            transition={{ delay: 0.25, duration: 0.8 }}
            className="text-xs uppercase text-[#f5c842]/45 mb-7 font-medium">
            Tu mixólogo personal con inteligencia artificial
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif font-bold leading-[1.04] mb-8">
            <span className="block text-5xl md:text-7xl lg:text-[5.5rem] text-white">El cóctel perfecto</span>
            <span className="block text-5xl md:text-7xl lg:text-[5.5rem] text-[#f5c842]">existe. Solo hay</span>
            <span className="block text-5xl md:text-7xl lg:text-[5.5rem] text-white">que inventarlo.</span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="text-lg md:text-xl text-white/55 max-w-2xl mx-auto mb-12 leading-relaxed">
            Describe cómo te sientes, qué ocasión es o qué tienes en casa.<br className="hidden md:block" />
            La IA crea tu receta, genera la imagen y la guarda para siempre.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(245,200,66,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onGetStarted}
              className="w-full sm:w-auto px-10 py-4 bg-[#f5c842] text-[#000810] font-bold text-base rounded-2xl hover:bg-[#ffd84d] transition-colors">
              Inventar mi primer cóctel →
            </motion.button>
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-10 py-4 border border-[#f5c842]/20 text-[#f5c842]/75 font-medium text-base rounded-2xl hover:border-[#f5c842]/45 hover:text-[#f5c842] transition-all">
              Ver creaciones reales ↓
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="grid grid-cols-3 gap-6 max-w-lg mx-auto pt-10 border-t border-[#f5c842]/8">
            {[
              { value: '12.400+', label: 'Cócteles creados' },
              { value: '3.200+', label: 'Bartenders' },
              { value: '4.8 ★', label: 'Valoración media' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-serif text-2xl font-bold text-[#f5c842]">{s.value}</p>
                <p className="text-[11px] text-white/35 mt-1 tracking-wide">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll mouse */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 border border-[#f5c842]/25 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-[#f5c842]/50 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════ TICKER ════════════════════════════════════════════════════════ */}
      <div className="border-y border-[#f5c842]/8 py-4 overflow-hidden bg-[#000c1f]/40">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="text-sm text-[#f5c842]/30 font-medium tracking-widest uppercase">
              {item} <span className="text-[#f5c842]/15 mx-4">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ════ CÓMO FUNCIONA ═════════════════════════════════════════════════ */}
      <section id="experiencia" className="py-36 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger} className="text-center mb-24">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/45 mb-5">El proceso</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold leading-tight">
              De la idea al vaso<br /><span className="text-[#f5c842]">en 10 segundos</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#f5c842]/8 rounded-3xl overflow-hidden">
            {[
              { n: '01', icon: '💬', title: 'Describe el momento', desc: '"Algo tropical para la terraza", "clásico y elegante para cenar", "sin alcohol pero con carácter". La IA te entiende.' },
              { n: '02', icon: '✨', title: 'La IA lo inventa', desc: 'Receta única. Proporciones exactas. Técnica de preparación. Historia del cóctel. Imagen generada al momento.' },
              { n: '03', icon: '🚀', title: 'Guarda y comparte', desc: 'Tu catálogo personal crece. Comparte la tarjeta del cóctel en redes. Cada receta, tuya para siempre.' },
            ].map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.18, duration: 0.7 }}
                className="bg-[#000c1f] p-10 md:p-12 flex flex-col gap-5 group hover:bg-[#000f24] transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{step.icon}</span>
                  <span className="font-serif text-[#f5c842]/15 text-7xl font-bold leading-none group-hover:text-[#f5c842]/25 transition-colors duration-300">{step.n}</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-white">{step.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ DEMO ══════════════════════════════════════════════════════════ */}
      <section id="demo" className="py-24 px-6 bg-[#000c1f]/50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger} className="text-center mb-16">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/45 mb-5">Creaciones reales</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold leading-tight">
              Cada receta,<br /><span className="text-[#f5c842]">única como tú</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Lista */}
            <div className="flex flex-col gap-3">
              {DEMO_COCKTAILS.map((cocktail, i) => (
                <motion.button key={cocktail.name}
                  onClick={() => setActiveDemo(i)}
                  whileHover={{ x: 6 }}
                  className={`text-left p-6 rounded-2xl border transition-all duration-300 ${
                    activeDemo === i
                      ? 'border-[#f5c842]/45 bg-[#f5c842]/7 shadow-lg shadow-[#f5c842]/5'
                      : 'border-[#f5c842]/8 hover:border-[#f5c842]/22 bg-[#000810]/40'
                  }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{cocktail.emoji}</span>
                    <span className={`font-serif font-bold text-xl transition-colors ${activeDemo === i ? 'text-[#f5c842]' : 'text-white/80'}`}>
                      {cocktail.name}
                    </span>
                    {activeDemo === i && (
                      <motion.span layoutId="active-dot"
                        className="ml-auto w-2 h-2 rounded-full bg-[#f5c842]" />
                    )}
                  </div>
                  <p className="text-sm text-white/45 ml-9 leading-relaxed">{cocktail.desc}</p>
                  <div className="flex gap-2 mt-3 ml-9">
                    {cocktail.tags.map(t => (
                      <span key={t} className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#f5c842]/12 text-[#f5c842]/45 tracking-wide">
                        {t}
                      </span>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Imagen */}
            <div className="relative aspect-square rounded-3xl overflow-hidden border border-[#f5c842]/12 shadow-2xl shadow-black/50">
              <AnimatePresence mode="wait">
                <motion.img key={c.img} src={c.img} alt={c.name}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.55 }}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/default-cocktail.jpg'; }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-[#000810]/85 via-[#000810]/10 to-transparent" />

              {/* Overlay info */}
              <div className="absolute bottom-5 left-5 right-5">
                <AnimatePresence mode="wait">
                  <motion.div key={c.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}>
                    <p className="font-serif text-2xl font-bold text-[#f5c842]">{c.name}</p>
                    <p className="text-xs text-white/50 mt-1 tracking-widest uppercase">Generado con IA · Imagen exclusiva</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Badge */}
              <div className="absolute top-5 left-5 bg-[#000810]/75 backdrop-blur-md border border-[#f5c842]/20 rounded-xl px-3 py-2">
                <p className="text-[11px] text-[#f5c842] font-semibold tracking-wide">✨ IA generativa</p>
              </div>

              {/* Dots */}
              <div className="absolute top-5 right-5 flex gap-1.5">
                {DEMO_COCKTAILS.map((_, i) => (
                  <button key={i} onClick={() => setActiveDemo(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeDemo ? 'bg-[#f5c842]' : 'bg-white/20 hover:bg-white/40'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ SECCIÓN EDITORIAL ══════════════════════════════════════════════ */}
      <section className="py-36 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(245,200,66,0.05),transparent)]" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Texto editorial */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}>
              <p className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/45 mb-6">La experiencia</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold leading-[1.1] mb-8">
                No es un generador.<br />
                <span className="text-[#f5c842]">Es tu bartender</span><br />
                de cabecera.
              </h2>
              <p className="text-white/55 leading-relaxed text-lg mb-6">
                Hay una diferencia entre una receta y <em>tu</em> receta. Entre lo que todos piden y lo que tú necesitas en este momento exacto.
              </p>
              <p className="text-white/40 leading-relaxed">
                Mi Bartender IA no te da listas. Te escucha. Interpreta el estado de ánimo, la ocasión, lo que tienes en casa. Y crea algo que no existe en ningún libro de coctelería.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  { n: '∞', label: 'Recetas posibles' },
                  { n: '< 10s', label: 'Por cóctel' },
                  { n: '100%', label: 'Exclusivas' },
                  { n: '24 / 7', label: 'Disponible' },
                ].map(item => (
                  <div key={item.label} className="border border-[#f5c842]/10 rounded-2xl p-4">
                    <p className="font-serif text-2xl font-bold text-[#f5c842]">{item.n}</p>
                    <p className="text-xs text-white/35 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Mood showcase */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}>
              <p className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/45 mb-6">¿Cuál es la ocasión?</p>
              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((mood, i) => (
                  <motion.div key={mood.id}
                    animate={{ borderColor: activeMood === i ? 'rgba(245,200,66,0.45)' : 'rgba(245,200,66,0.08)', backgroundColor: activeMood === i ? 'rgba(245,200,66,0.07)' : 'rgba(0,12,31,0.4)' }}
                    transition={{ duration: 0.4 }}
                    onClick={() => setActiveMood(i)}
                    className="p-4 rounded-2xl border cursor-pointer transition-all">
                    <span className="text-2xl block mb-2">{mood.emoji}</span>
                    <p className={`text-sm font-semibold transition-colors ${activeMood === i ? 'text-[#f5c842]' : 'text-white/70'}`}>
                      {mood.label}
                    </p>
                    <p className="text-xs text-white/35 mt-0.5">{mood.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════ FEATURES ═══════════════════════════════════════════════════════ */}
      <section className="py-32 px-6 bg-[#000c1f]/50">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger} className="text-center mb-20">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/45 mb-5">Todo en uno</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold leading-tight">
              No es solo una receta.<br /><span className="text-[#f5c842]">Es una experiencia.</span>
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                whileHover={{ y: -5, borderColor: 'rgba(245,200,66,0.28)' }}
                className="p-7 border border-[#f5c842]/8 rounded-2xl bg-[#000810]/60 transition-all duration-300 group cursor-default">
                <span className="text-4xl block mb-5">{f.icon}</span>
                <h3 className="font-semibold text-white mb-2 group-hover:text-[#f5c842] transition-colors">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════ TESTIMONIOS ════════════════════════════════════════════════════ */}
      <section id="bartenders" className="py-36 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger} className="text-center mb-20">
            <motion.p variants={fadeUp} className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/45 mb-5">La comunidad</motion.p>
            <motion.h2 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-bold leading-tight">
              Lo que dicen<br /><span className="text-[#f5c842]">nuestros bartenders</span>
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                className="p-8 border border-[#f5c842]/10 rounded-3xl bg-[#000c1f]/60 flex flex-col gap-5 hover:border-[#f5c842]/22 transition-colors duration-300">
                {/* Quote */}
                <p className="text-[#f5c842]/20 font-serif text-5xl leading-none">"</p>
                <p className="text-white/70 text-sm leading-relaxed -mt-6">
                  {t.quote}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-[#f5c842]/8 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-[#f5c842]/10 flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.author}</p>
                    <p className="text-xs text-[#f5c842]/50 italic">creó: {t.cocktail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════ COMPARTIR / VIRAL ══════════════════════════════════════════════ */}
      <section className="py-32 px-6 bg-[#000c1f]/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}>
              <p className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/45 mb-6">Hecho para compartir</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold leading-[1.1] mb-6">
                Cada cóctel,<br />
                <span className="text-[#f5c842]">una historia</span><br />
                que contar.
              </h2>
              <p className="text-white/50 leading-relaxed text-lg mb-8">
                Genera la tarjeta visual de tu cóctel en segundos. Lista para Instagram, TikTok o WhatsApp. Con la imagen de IA, el nombre y la receta.
              </p>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(245,200,66,0.25)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onGetStarted}
                className="px-8 py-4 bg-[#f5c842] text-[#000810] font-bold rounded-2xl hover:bg-[#ffd84d] transition-colors">
                Crear y compartir →
              </motion.button>
            </motion.div>

            {/* Mockup tarjeta */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative">
              <div className="relative w-72 mx-auto">
                {/* Tarjeta de fondo (efecto stack) */}
                <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl border border-[#f5c842]/10 bg-[#000c1f]" />
                <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-3xl border border-[#f5c842]/15 bg-[#000f24]" />

                {/* Tarjeta principal */}
                <div className="relative rounded-3xl border border-[#f5c842]/30 bg-gradient-to-br from-[#000f24] to-[#000810] overflow-hidden shadow-2xl shadow-black/60">
                  <div className="h-44 bg-[#0a1a3a] relative overflow-hidden">
                    <img src={DEMO_COCKTAILS[0].img} alt="cocktail"
                      className="w-full h-full object-cover opacity-80"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/default-cocktail.jpg'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#000f24]/60 to-transparent" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">🍸</span>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#f5c842]/50">Mi Bartender IA</span>
                    </div>
                    <p className="font-serif text-xl font-bold text-[#f5c842] mb-1">{DEMO_COCKTAILS[0].name}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{DEMO_COCKTAILS[0].desc}</p>
                    <div className="flex items-center gap-1 mt-3">
                      {[1,2,3,4,5].map(n => (
                        <span key={n} className="text-[#f5c842] text-xs">★</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Badge compartir */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-4 -bottom-3 bg-[#f5c842] text-[#000810] text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
                  📤 Compartir
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════ CTA FINAL ══════════════════════════════════════════════════════ */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(245,200,66,0.09),transparent)]" />
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#f5c842]/12 to-transparent hidden lg:block" />
        <div className="absolute right-8 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#f5c842]/12 to-transparent hidden lg:block" />

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={stagger} className="relative z-10 max-w-3xl mx-auto">

          <motion.div variants={fadeUp}
            className="text-8xl mb-10 inline-block filter drop-shadow-[0_0_40px_rgba(245,200,66,0.4)]">
            🍸
          </motion.div>

          <motion.p variants={fadeUp}
            className="text-xs tracking-[0.35em] uppercase text-[#f5c842]/45 mb-6">
            Tu próxima obra maestra líquida
          </motion.p>

          <motion.h2 variants={fadeUp}
            className="font-serif text-5xl md:text-7xl font-bold mb-8 leading-[1.04]">
            <span className="text-white">El cóctel perfecto</span><br />
            <span className="text-[#f5c842]">te espera.</span>
          </motion.h2>

          <motion.p variants={fadeUp}
            className="text-lg text-white/50 mb-12 leading-relaxed">
            Únete a más de 3.000 bartenders que ya están<br className="hidden md:block" />
            creando recetas que no existen en ningún libro.
          </motion.p>

          <motion.button variants={fadeUp}
            whileHover={{ scale: 1.04, boxShadow: '0 0 70px rgba(245,200,66,0.35)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="inline-flex items-center gap-3 px-12 py-5 bg-[#f5c842] text-[#000810] font-bold text-lg rounded-2xl hover:bg-[#ffd84d] transition-colors">
            <span>Inventar mi cóctel ahora</span>
            <span className="text-xl">→</span>
          </motion.button>
        </motion.div>
      </section>

      {/* ════ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#f5c842]/8 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🍸</span>
            <span className="font-serif text-[#f5c842] font-bold tracking-wide">Mi Bartender IA</span>
          </div>
          <p className="text-xs text-white/25 italic text-center tracking-wide">
            &ldquo;Beber es una necesidad, pero saber beber es un Arte.&rdquo;
          </p>
          <div className="flex items-center gap-4">
            <img src="/logo-borrachos.jpg" alt="Borrach@s y más"
              className="h-8 rounded-lg opacity-50" />
            <p className="text-xs text-white/20">© 2026 Borrach@s y más</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
