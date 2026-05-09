export type Locale = 'es' | 'en';

// ── Tipos explícitos ──────────────────────────────────────────────────────────

export interface Mood {
  id: string;
  emoji: string;
  label: string;
  hint: string;   // texto corto que se muestra en el input
  prompt: string; // prompt verbose que se envía a la IA (no visible)
}

export interface AppTranslations {
  title: string;
  tagline: string;
  inputLabel: string;
  inputPlaceholder: string;
  saveToCatalog: string;
  mixing: string;
  askBartender: string;
  recommendation: string;
  generatingImage: string;
  searchingImage: string;
  catalog: string;
  cocktailsSaved: (n: number) => string;
  noCocktails: string;
  noCocktailsHint: string;
  viewRecipe: string;
  visible: string;
  delete: string;
  deleting: string;
  signOut: string;
  confirmDelete: (name: string) => string;
  deleteError: string;
  loading: string;
  exportPdf: string;
  exportingPdf: string;
  changeImage: string;
  regeneratingImage: string;
  switchToEnglish: string;
  switchToDark: string;
  switchToLight: string;
  moodLabel: string;
  shareCard: string;
  rateThis: string;
  filterAll: string;
  filterBy: string;
  noResults: string;
  starRated: (n: number) => string;
  moods: Mood[];
}

export interface AuthTranslations {
  signIn: string;
  createAccount: string;
  email: string;
  password: string;
  confirmPassword: string;
  emailPlaceholder: string;
  signingIn: string;
  creatingAccount: string;
  enterBar: string;
  createMyAccount: string;
  noAccount: string;
  signUpFree: string;
  haveAccount: string;
  signInLink: string;
  tagline: string;
  accountCreated: string;
  errors: {
    invalidCredentials: string;
    emailNotConfirmed: string;
    alreadyRegistered: string;
    weakPassword: string;
    invalidEmail: string;
    passwordMismatch: string;
    passwordTooShort: string;
  };
}

export interface Translations {
  auth: AuthTranslations;
  app: AppTranslations;
}

// ── Traducciones ──────────────────────────────────────────────────────────────

export const translations: Record<Locale, Translations> = {
  es: {
    auth: {
      signIn: 'Iniciar sesión',
      createAccount: 'Crear cuenta',
      email: 'Email',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      emailPlaceholder: 'tu@email.com',
      signingIn: 'Iniciando sesión...',
      creatingAccount: 'Creando cuenta...',
      enterBar: 'Entrar al bar 🍸',
      createMyAccount: 'Crear mi cuenta',
      noAccount: '¿No tienes cuenta?',
      signUpFree: 'Regístrate gratis',
      haveAccount: '¿Ya tienes cuenta?',
      signInLink: 'Inicia sesión',
      tagline: 'Tu mixólogo personal con inteligencia artificial',
      accountCreated: '¡Cuenta creada! Revisa tu email para confirmar tu cuenta, luego inicia sesión.',
      errors: {
        invalidCredentials: 'Email o contraseña incorrectos.',
        emailNotConfirmed: 'Debes confirmar tu email antes de iniciar sesión.',
        alreadyRegistered: 'Este email ya está registrado. Inicia sesión.',
        weakPassword: 'La contraseña debe tener al menos 6 caracteres.',
        invalidEmail: 'Email inválido.',
        passwordMismatch: 'Las contraseñas no coinciden.',
        passwordTooShort: 'La contraseña debe tener al menos 6 caracteres.',
      },
    },
    app: {
      title: 'Mi Bartender IA',
      tagline: 'Tu mixólogo personal con inteligencia artificial',
      inputLabel: '¿Qué cóctel te apetece hoy?',
      inputPlaceholder: 'Ej: Algo refrescante con vodka y cítricos',
      saveToCatalog: 'Guardar este cóctel en mi catálogo',
      mixing: 'Mezclando ingredientes...',
      askBartender: 'Preguntar al bartender',
      recommendation: '🍹 Recomendación',
      generatingImage: '🎨 Generando imagen con IA...',
      searchingImage: 'Buscando imagen de referencia...',
      catalog: '📚 Mi Catálogo',
      cocktailsSaved: (n: number) =>
        `${n} cóctel${n !== 1 ? 'es' : ''} guardado${n !== 1 ? 's' : ''}`,
      noCocktails: 'Aún no tienes cócteles guardados.',
      noCocktailsHint: '¡Pregunta al bartender para empezar!',
      viewRecipe: 'Ver receta',
      visible: '✓ Visible',
      delete: 'Borrar',
      deleting: 'Borrando...',
      signOut: 'Cerrar sesión',
      confirmDelete: (name: string) =>
        `¿Borrar "${name}"? Esta acción no se puede deshacer.`,
      deleteError: 'Error al borrar: ',
      loading: 'Cargando...',
      exportPdf: 'PDF',
      exportingPdf: 'Preparando...',
      changeImage: 'Cambiar imagen',
      regeneratingImage: 'Generando nueva imagen...',
      switchToEnglish: '🇬🇧 EN',
      switchToDark: '🌙',
      switchToLight: '☀️',
      moodLabel: '¿Cuál es la ocasión?',
      shareCard: 'Compartir tarjeta',
      rateThis: 'Valorar',
      filterAll: '✦ Todos',
      filterBy: 'Filtrar por etiqueta',
      noResults: 'No hay cócteles con esta etiqueta.',
      starRated: (n: number) => `${n} estrella${n !== 1 ? 's' : ''}`,
      moods: [
        { id: 'romantic',  emoji: '💑', label: 'Romántico',   hint: 'algo romántico para una cena de dos',        prompt: 'Quiero un cóctel romántico y sofisticado para una cena especial en pareja' },
        { id: 'party',     emoji: '🎉', label: 'Fiesta',      hint: 'algo festivo y colorido para el grupo',       prompt: 'Quiero un cóctel divertido y festivo para una fiesta con amigos, algo colorido y con mucho sabor' },
        { id: 'chill',     emoji: '🌅', label: 'Relajado',    hint: 'algo suave para relajarme esta tarde',        prompt: 'Quiero un cóctel relajante y suave para una tarde tranquila' },
        { id: 'noalcohol', emoji: '🌿', label: 'Sin alcohol', hint: 'un mocktail fresco, sin alcohol',             prompt: 'Quiero un cóctel sin alcohol, refrescante y delicioso (mocktail)' },
        { id: 'tropical',  emoji: '🌴', label: 'Tropical',    hint: 'algo tropical y frutal bien helado',          prompt: 'Quiero un cóctel tropical, exótico y refrescante con sabores frutales' },
        { id: 'classic',   emoji: '🎩', label: 'Clásico',     hint: 'un clásico elegante, de los de siempre',      prompt: 'Quiero un cóctel clásico y elegante, de los que se han servido en los mejores bares del mundo' },
      ],
    },
  },

  en: {
    auth: {
      signIn: 'Sign In',
      createAccount: 'Create Account',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      emailPlaceholder: 'your@email.com',
      signingIn: 'Signing in...',
      creatingAccount: 'Creating account...',
      enterBar: 'Enter the bar 🍸',
      createMyAccount: 'Create my account',
      noAccount: "Don't have an account?",
      signUpFree: 'Sign up for free',
      haveAccount: 'Already have an account?',
      signInLink: 'Sign in',
      tagline: 'Your personal mixologist with artificial intelligence',
      accountCreated: 'Account created! Check your email to confirm, then sign in.',
      errors: {
        invalidCredentials: 'Incorrect email or password.',
        emailNotConfirmed: 'Please confirm your email before signing in.',
        alreadyRegistered: 'This email is already registered. Sign in instead.',
        weakPassword: 'Password must be at least 6 characters.',
        invalidEmail: 'Invalid email address.',
        passwordMismatch: 'Passwords do not match.',
        passwordTooShort: 'Password must be at least 6 characters.',
      },
    },
    app: {
      title: 'My AI Bartender',
      tagline: 'Your personal mixologist with artificial intelligence',
      inputLabel: 'What cocktail are you in the mood for?',
      inputPlaceholder: 'E.g.: Something refreshing with vodka and citrus',
      saveToCatalog: 'Save this cocktail to my catalog',
      mixing: 'Mixing ingredients...',
      askBartender: 'Ask the bartender',
      recommendation: '🍹 Recommendation',
      generatingImage: '🎨 Generating image with AI...',
      searchingImage: 'Searching for reference image...',
      catalog: '📚 My Catalog',
      cocktailsSaved: (n: number) => `${n} cocktail${n !== 1 ? 's' : ''} saved`,
      noCocktails: "You don't have any saved cocktails yet.",
      noCocktailsHint: 'Ask the bartender to get started!',
      viewRecipe: 'View recipe',
      visible: '✓ Visible',
      delete: 'Delete',
      deleting: 'Deleting...',
      signOut: 'Sign out',
      confirmDelete: (name: string) =>
        `Delete "${name}"? This action cannot be undone.`,
      deleteError: 'Error deleting: ',
      loading: 'Loading...',
      exportPdf: 'PDF',
      exportingPdf: 'Preparing...',
      changeImage: 'Change image',
      regeneratingImage: 'Generating new image...',
      switchToEnglish: '🇪🇸 ES',
      switchToDark: '🌙',
      switchToLight: '☀️',
      moodLabel: "What's the occasion?",
      shareCard: 'Share card',
      rateThis: 'Rate',
      filterAll: '✦ All',
      filterBy: 'Filter by tag',
      noResults: 'No cocktails with this tag.',
      starRated: (n: number) => `${n} star${n !== 1 ? 's' : ''}`,
      moods: [
        { id: 'romantic',  emoji: '💑', label: 'Romantic',    hint: 'something romantic for a dinner for two',     prompt: 'I want a romantic and sophisticated cocktail for a special dinner for two' },
        { id: 'party',     emoji: '🎉', label: 'Party',       hint: 'something fun and colorful for the group',    prompt: 'I want a fun and festive cocktail for a party with friends, something colorful and flavorful' },
        { id: 'chill',     emoji: '🌅', label: 'Chill',       hint: 'something smooth to unwind this afternoon',   prompt: 'I want a relaxing and smooth cocktail for a quiet afternoon' },
        { id: 'noalcohol', emoji: '🌿', label: 'No alcohol',  hint: 'a fresh mocktail, no alcohol',                prompt: 'I want a non-alcoholic cocktail, refreshing and delicious (mocktail)' },
        { id: 'tropical',  emoji: '🌴', label: 'Tropical',    hint: 'something tropical and fruity, extra cold',   prompt: 'I want a tropical, exotic and refreshing cocktail with fruity flavors' },
        { id: 'classic',   emoji: '🎩', label: 'Classic',     hint: 'a timeless classic from the finest bars',     prompt: "I want a classic and elegant cocktail, the kind served in the world's finest bars" },
      ],
    },
  },
};

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'es';
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('en')) return 'en';
  return 'es';
}
