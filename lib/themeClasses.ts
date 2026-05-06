/** Devuelve el conjunto de clases Tailwind según el tema activo */
export function getThemeClasses(isDark: boolean) {
  const a = isDark ? '#f5c842' : '#8B6914';   // color acento principal
  const aD = isDark ? '#d4a832' : '#6b4f0a';  // acento oscuro

  return {
    // ── Fondos ───────────────────────────────────────────────────────────────
    pageBg: isDark
      ? 'bg-gradient-to-br from-[#000308] via-[#000c1f] to-[#000614]'
      : 'bg-gradient-to-br from-[#f0e8d0] via-[#f7f0e0] to-[#ede4ca]',
    cardBg: isDark
      ? 'bg-[#000510]/70 backdrop-blur-md border border-[#f5c842]/20'
      : 'bg-white/85 backdrop-blur-md border border-[#8B6914]/20 shadow-lg',
    catalogBg: isDark
      ? 'bg-[#00050f]/75 backdrop-blur-sm border border-[#f5c842]/20'
      : 'bg-white/75 backdrop-blur-sm border border-[#8B6914]/20 shadow-md',
    inputBg: isDark
      ? 'bg-[#00061a] text-[#f5c842] placeholder-[#f5c842]/40 border-[#1a3a6a] focus:border-[#f5c842]'
      : 'bg-[#fdfaf2] text-[#1a0c00] placeholder-[#8B6914]/50 border-[#d4b870] focus:border-[#8B6914]',
    recipeBox: isDark
      ? 'bg-[#000308]/60 border border-[#f5c842]/20'
      : 'bg-[#fdf8ec]/80 border border-[#8B6914]/20',
    errorBox: isDark
      ? 'bg-red-900/40 border-red-500/30 text-red-300'
      : 'bg-red-50 border-red-300 text-red-700',

    // ── Texto ────────────────────────────────────────────────────────────────
    textPrimary: isDark ? 'text-[#f5c842]' : 'text-[#8B6914]',
    textTitle: isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]',
    textTagline: isDark ? 'text-[#f5c842]/85' : 'text-[#8B6914]/80',
    textLabel: isDark ? 'text-[#f5c842]' : 'text-[#8B6914]',
    textMuted: isDark ? 'text-[#f5c842]/60' : 'text-[#8B6914]/60',
    textFaint: isDark ? 'text-[#f5c842]/40' : 'text-[#8B6914]/45',
    textSub: isDark ? 'text-[#f5c842]/50' : 'text-[#8B6914]/55',
    textRecipe: isDark ? 'text-[#f5c842]/90' : 'text-[#3a2200]/90',
    textSpinner: isDark ? 'text-[#f5c842]/75' : 'text-[#8B6914]/75',
    textRecommTitle: isDark ? 'text-[#f5c842]' : 'text-[#6b4f0a]',

    // ── Bordes ───────────────────────────────────────────────────────────────
    borderAccent: isDark ? 'border-[#f5c842]/20' : 'border-[#8B6914]/20',
    borderDivider: isDark ? 'border-[#f5c842]/10' : 'border-[#8B6914]/12',
    borderImg: isDark ? 'border-[#f5c842]/40' : 'border-[#8B6914]/35',
    borderThumb: isDark ? 'border-[#f5c842]/20' : 'border-[#8B6914]/20',

    // ── Botón principal ──────────────────────────────────────────────────────
    btnPrimary: isDark
      ? `bg-gradient-to-r from-[#f5c842] to-[#d4a832] hover:from-[#e6b830] hover:to-[#c49628]
         border border-[#f5c842]/50 text-[#000510] shadow-lg shadow-[#f5c842]/20`
      : `bg-gradient-to-r from-[#c9a227] to-[#a07d10] hover:from-[#b8901f] hover:to-[#8f6e0a]
         border border-[#c9a227]/60 text-white shadow-lg shadow-[#8B6914]/20`,

    // ── Botón cerrar sesión ──────────────────────────────────────────────────
    btnSignOut: isDark
      ? 'border-[#f5c842]/20 text-[#f5c842]/60 hover:border-[#f5c842]/50 hover:text-[#f5c842]'
      : 'border-[#8B6914]/20 text-[#8B6914]/60 hover:border-[#8B6914]/50 hover:text-[#8B6914]',

    // ── Botón toggle (tema/idioma) ───────────────────────────────────────────
    btnToggle: isDark
      ? 'bg-[#f5c842]/10 border border-[#f5c842]/25 text-[#f5c842]/80 hover:bg-[#f5c842]/20 hover:text-[#f5c842]'
      : 'bg-[#8B6914]/10 border border-[#8B6914]/25 text-[#8B6914]/70 hover:bg-[#8B6914]/15 hover:text-[#8B6914]',

    // ── Avatar usuario ───────────────────────────────────────────────────────
    avatar: isDark
      ? 'bg-[#f5c842]/20 border border-[#f5c842]/40 text-[#f5c842]'
      : 'bg-[#8B6914]/15 border border-[#8B6914]/35 text-[#8B6914]',

    // ── Spinner ──────────────────────────────────────────────────────────────
    spinner: isDark ? 'border-[#f5c842]' : 'border-[#8B6914]',

    // ── Card catálogo ────────────────────────────────────────────────────────
    catalogCard: (isActive: boolean) => isDark
      ? isActive
        ? 'border-[#f5c842]/60 bg-[#f5c842]/10 shadow-md shadow-[#f5c842]/10'
        : 'border-[#f5c842]/15 bg-black/30 hover:border-[#f5c842]/35 hover:bg-black/50'
      : isActive
        ? 'border-[#8B6914]/60 bg-[#8B6914]/10 shadow-md shadow-[#8B6914]/10'
        : 'border-[#8B6914]/15 bg-white/50 hover:border-[#8B6914]/40 hover:bg-white/80',

    thumbBg: isDark ? 'bg-[#000c1f]' : 'bg-[#f5edd5]',

    catalogCardTitle: (isActive: boolean) => isDark
      ? isActive ? 'text-[#f5c842]' : 'text-[#f5c842]/85'
      : isActive ? 'text-[#6b4f0a]' : 'text-[#8B6914]/85',

    btnView: (isActive: boolean) => isDark
      ? isActive
        ? 'bg-[#f5c842]/20 text-[#f5c842]'
        : 'text-[#f5c842]/70 hover:bg-[#f5c842]/10 hover:text-[#f5c842]'
      : isActive
        ? 'bg-[#8B6914]/20 text-[#6b4f0a]'
        : 'text-[#8B6914]/70 hover:bg-[#8B6914]/10 hover:text-[#8B6914]',

    // ── Título con sombra dorada ─────────────────────────────────────────────
    titleGlow: isDark
      ? 'drop-shadow-[0_0_18px_#f5c84240]'
      : 'drop-shadow-[0_0_10px_#8B691430]',
  };
}

export type ThemeClasses = ReturnType<typeof getThemeClasses>;
