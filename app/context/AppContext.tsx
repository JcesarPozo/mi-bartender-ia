'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Locale, type Translations, translations, detectLocale } from '@/lib/i18n';
import { getThemeClasses, type ThemeClasses } from '@/lib/themeClasses';

type Theme = 'dark' | 'light';

interface AppContextValue {
  theme: Theme;
  isDark: boolean;
  locale: Locale;
  t: Translations;
  tc: ThemeClasses;
  toggleTheme: () => void;
  setLocale: (l: Locale) => void;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [locale, setLocaleState] = useState<Locale>('es');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme  = (localStorage.getItem('bartender-theme')  as Theme  | null) ?? 'dark';
    const savedLocale = (localStorage.getItem('bartender-locale') as Locale | null) ?? detectLocale();
    setTheme(savedTheme);
    setLocaleState(savedLocale);
    applyThemeClass(savedTheme);
    applyLang(savedLocale);
    setReady(true);
  }, []);

  const applyThemeClass = (t: Theme) => {
    const html = document.documentElement;
    html.classList.toggle('dark',  t === 'dark');
    html.classList.toggle('light', t === 'light');
  };

  const applyLang = (l: Locale) => {
    document.documentElement.lang = l;
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyThemeClass(next);
    localStorage.setItem('bartender-theme', next);
  };

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    applyLang(l);
    localStorage.setItem('bartender-locale', l);
  };

  const isDark  = theme === 'dark';
  const t       = translations[locale];
  const tc      = getThemeClasses(isDark);

  // Evitar flash de contenido sin estilos — render invisible hasta que se cargue la preferencia
  if (!ready) return (
    <div className="min-h-screen bg-[#000308] flex items-center justify-center">
      <div className="text-6xl animate-bounce">🍸</div>
    </div>
  );

  return (
    <AppContext.Provider value={{ theme, isDark, locale, t, tc, toggleTheme, setLocale }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
