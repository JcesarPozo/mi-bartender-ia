'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/context/AppContext';
import type { ProMessage } from '@/app/api/pro-chat/route';

interface ProBarProps {
  accessToken: string;
  onSaved: () => void;        // recargar catálogo al guardar
  onClose: () => void;
}

export default function ProBar({ accessToken, onSaved, onClose }: ProBarProps) {
  const { isDark, locale, tc } = useApp();
  const [messages, setMessages] = useState<ProMessage[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [lastCocktailName, setLastCocktailName] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const gold     = isDark ? '#f5c842' : '#8B6914';
  const goldFaint = isDark ? '#f5c842' : '#6b4f0a';

  // Saludo inicial del bartender
  useEffect(() => {
    const greeting: ProMessage = {
      role: 'assistant',
      content: locale === 'es'
        ? '¡Bienvenido al **Modo Pro** 🍸! Soy tu bartender personal. Dime qué tienes ganas de tomar, descríbeme tus gustos, o simplemente deja que te sorprenda. Podemos conversar, ajustar y perfeccionar tu cóctel ideal. ¿Qué te apetece hoy?'
        : 'Welcome to **Pro Mode** 🍸! I\'m your personal bartender. Tell me what you\'re in the mood for, describe your tastes, or just let me surprise you. We can chat, adjust, and perfect your ideal cocktail. What can I mix for you today?',
    };
    setMessages([greeting]);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [locale]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ProMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/pro-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ messages: newMessages, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      const assistantMsg: ProMessage = { role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, assistantMsg]);
      if (data.cocktailName) setLastCocktailName(data.cocktailName);
    } catch (err: any) {
      const errMsg: ProMessage = {
        role: 'assistant',
        content: locale === 'es'
          ? `Lo siento, hubo un error: ${err.message}`
          : `Sorry, there was an error: ${err.message}`,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lastCocktailName || saving) return;
    // Extraer la última receta del asistente
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistant) return;

    setSaving(true);
    try {
      const res = await fetch('/api/pro-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messages,
          locale,
          saveRequest: { cocktailName: lastCocktailName, recipe: lastAssistant.content },
        }),
      });
      const data = await res.json();
      if (data.saved) {
        setSavedMsg(locale === 'es' ? '✅ ¡Guardado en tu catálogo!' : '✅ Saved to your catalog!');
        onSaved();
        setTimeout(() => setSavedMsg(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const greeting: ProMessage = {
      role: 'assistant',
      content: locale === 'es'
        ? '¡Nueva ronda! 🍸 ¿Qué cóctel creamos ahora?'
        : 'New round! 🍸 What cocktail shall we create now?',
    };
    setMessages([greeting]);
    setLastCocktailName(null);
    setSavedMsg('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col rounded-2xl overflow-hidden shadow-2xl
        ${isDark ? 'bg-[#000510]/95 border border-[#f5c842]/25' : 'bg-white/95 border border-[#8B6914]/20'}`}
      style={{ height: '620px' }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-3 border-b shrink-0
        ${isDark ? 'border-[#f5c842]/15 bg-[#f5c842]/5' : 'border-[#8B6914]/10 bg-[#8B6914]/4'}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🍸</span>
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>
              Bartender Pro
            </p>
            <p className={`text-[10px] ${isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/60'}`}>
              {locale === 'es' ? 'Modo conversacional · Premium' : 'Conversational mode · Premium'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${isDark ? 'border border-[#f5c842]/20 text-[#f5c842]/60 hover:border-[#f5c842]/40 hover:text-[#f5c842]'
                       : 'border border-[#8B6914]/20 text-[#8B6914]/60 hover:border-[#8B6914]/40 hover:text-[#8B6914]'}`}>
            🔄 {locale === 'es' ? 'Nuevo' : 'New'}
          </button>
          <button onClick={onClose}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all
              ${isDark ? 'text-[#f5c842]/50 hover:bg-[#f5c842]/10' : 'text-[#8B6914]/50 hover:bg-[#8B6914]/10'}`}>
            ✕
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mr-2 mt-1
                  ${isDark ? 'bg-[#f5c842]/15 border border-[#f5c842]/30' : 'bg-[#8B6914]/10 border border-[#8B6914]/20'}`}>
                  🍸
                </div>
              )}
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm
                ${msg.role === 'user'
                  ? isDark
                    ? 'bg-[#f5c842] text-[#000510] rounded-br-sm'
                    : 'bg-[#c9a227] text-white rounded-br-sm'
                  : isDark
                    ? 'bg-[#000c1f] border border-[#f5c842]/15 text-[#f5c842]/90 rounded-bl-sm'
                    : 'bg-[#faf7ee] border border-[#8B6914]/15 text-[#2a1800] rounded-bl-sm'
                }`}>
                {msg.role === 'assistant'
                  ? <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : 'prose-stone'}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  : msg.content
                }
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0
              ${isDark ? 'bg-[#f5c842]/15 border border-[#f5c842]/30' : 'bg-[#8B6914]/10 border border-[#8B6914]/20'}`}>
              🍸
            </div>
            <div className={`rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1
              ${isDark ? 'bg-[#000c1f] border border-[#f5c842]/15' : 'bg-[#faf7ee] border border-[#8B6914]/15'}`}>
              {[0, 1, 2].map(i => (
                <motion.div key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  className={`w-2 h-2 rounded-full ${isDark ? 'bg-[#f5c842]/60' : 'bg-[#8B6914]/60'}`}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Guardar + confirmación */}
      <AnimatePresence>
        {lastCocktailName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`px-4 py-2 border-t flex items-center justify-between gap-2
              ${isDark ? 'border-[#f5c842]/10 bg-[#f5c842]/5' : 'border-[#8B6914]/10 bg-[#8B6914]/4'}`}>
            {savedMsg
              ? <p className={`text-xs font-semibold ${isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]'}`}>{savedMsg}</p>
              : <>
                  <p className={`text-xs truncate ${isDark ? 'text-[#f5c842]/70' : 'text-[#4a3a0a]'}`}>
                    🍹 <strong>{lastCocktailName}</strong>
                  </p>
                  <motion.button onClick={handleSave} disabled={saving}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50
                      ${isDark
                        ? 'bg-[#f5c842] text-[#000510] hover:bg-[#e6b830]'
                        : 'bg-[#c9a227] text-white hover:bg-[#b8901f]'}`}>
                    {saving ? '...' : (locale === 'es' ? '💾 Guardar' : '💾 Save')}
                  </motion.button>
                </>
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className={`px-4 py-3 border-t shrink-0 ${isDark ? 'border-[#f5c842]/10' : 'border-[#8B6914]/10'}`}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={locale === 'es' ? 'Habla con tu bartender...' : 'Talk to your bartender...'}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl border-2 outline-none text-sm transition-colors
              ${isDark
                ? 'bg-[#00061a] text-[#f5c842] placeholder-[#f5c842]/40 border-[#1a3a6a] focus:border-[#f5c842]'
                : 'bg-[#fdfaf2] text-[#1a0c00] placeholder-[#8B6914]/50 border-[#d4b870] focus:border-[#8B6914]'}`}
          />
          <motion.button onClick={sendMessage} disabled={loading || !input.trim()}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40
              ${isDark
                ? 'bg-[#f5c842] text-[#000510] hover:bg-[#e6b830]'
                : 'bg-[#c9a227] text-white hover:bg-[#b8901f]'}`}>
            ↑
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
