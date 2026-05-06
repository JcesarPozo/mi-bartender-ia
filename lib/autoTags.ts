/**
 * autoTags.ts
 * Genera etiquetas automáticas a partir del nombre y receta de un cóctel.
 * No requiere dependencias externas.
 */

export interface Tag {
  id: string;
  label: string;
  labelEn: string;
  emoji: string;
  color: string; // clase Tailwind de color de fondo (oscuro)
  colorLight: string; // clase Tailwind modo claro
}

export const ALL_TAGS: Tag[] = [
  // ── Bases alcohólicas ──────────────────────────────────────────────────────
  { id: 'ron',      label: 'Ron',       labelEn: 'Rum',       emoji: '🥃', color: 'bg-amber-900/60 text-amber-200',   colorLight: 'bg-amber-100 text-amber-900' },
  { id: 'vodka',    label: 'Vodka',     labelEn: 'Vodka',     emoji: '🍸', color: 'bg-blue-900/60 text-blue-200',     colorLight: 'bg-blue-100 text-blue-900' },
  { id: 'tequila',  label: 'Tequila',   labelEn: 'Tequila',   emoji: '🌵', color: 'bg-green-900/60 text-green-200',   colorLight: 'bg-green-100 text-green-900' },
  { id: 'gin',      label: 'Gin',       labelEn: 'Gin',       emoji: '🌿', color: 'bg-teal-900/60 text-teal-200',     colorLight: 'bg-teal-100 text-teal-900' },
  { id: 'whisky',   label: 'Whisky',    labelEn: 'Whisky',    emoji: '🥃', color: 'bg-orange-900/60 text-orange-200', colorLight: 'bg-orange-100 text-orange-900' },
  { id: 'vino',     label: 'Vino',      labelEn: 'Wine',      emoji: '🍷', color: 'bg-rose-900/60 text-rose-200',     colorLight: 'bg-rose-100 text-rose-900' },
  { id: 'champagne',label: 'Champagne', labelEn: 'Champagne', emoji: '🥂', color: 'bg-yellow-900/60 text-yellow-200', colorLight: 'bg-yellow-100 text-yellow-900' },
  { id: 'cerveza',  label: 'Cerveza',   labelEn: 'Beer',      emoji: '🍺', color: 'bg-yellow-800/60 text-yellow-100', colorLight: 'bg-yellow-50 text-yellow-800' },
  { id: 'licor',    label: 'Licor',     labelEn: 'Liqueur',   emoji: '🫙', color: 'bg-purple-900/60 text-purple-200', colorLight: 'bg-purple-100 text-purple-900' },

  // ── Tipos / Estilos ────────────────────────────────────────────────────────
  { id: 'tropical',   label: 'Tropical',    labelEn: 'Tropical',    emoji: '🌴', color: 'bg-lime-900/60 text-lime-200',    colorLight: 'bg-lime-100 text-lime-900' },
  { id: 'citrico',    label: 'Cítrico',     labelEn: 'Citrus',      emoji: '🍋', color: 'bg-yellow-900/60 text-yellow-200',colorLight: 'bg-yellow-100 text-yellow-800' },
  { id: 'dulce',      label: 'Dulce',       labelEn: 'Sweet',       emoji: '🍬', color: 'bg-pink-900/60 text-pink-200',    colorLight: 'bg-pink-100 text-pink-900' },
  { id: 'amargo',     label: 'Amargo',      labelEn: 'Bitter',      emoji: '🌑', color: 'bg-gray-800/60 text-gray-200',    colorLight: 'bg-gray-200 text-gray-800' },
  { id: 'cremoso',    label: 'Cremoso',     labelEn: 'Creamy',      emoji: '🥛', color: 'bg-slate-700/60 text-slate-200',  colorLight: 'bg-slate-100 text-slate-800' },
  { id: 'frozen',     label: 'Frozen',      labelEn: 'Frozen',      emoji: '❄️', color: 'bg-cyan-900/60 text-cyan-200',    colorLight: 'bg-cyan-100 text-cyan-900' },
  { id: 'picante',    label: 'Picante',     labelEn: 'Spicy',       emoji: '🌶️', color: 'bg-red-900/60 text-red-200',     colorLight: 'bg-red-100 text-red-900' },
  { id: 'noalcohol',  label: 'Sin alcohol', labelEn: 'No alcohol',  emoji: '🍃', color: 'bg-green-900/60 text-green-200',  colorLight: 'bg-green-100 text-green-900' },
  { id: 'clasico',    label: 'Clásico',     labelEn: 'Classic',     emoji: '🎩', color: 'bg-stone-800/60 text-stone-200',  colorLight: 'bg-stone-200 text-stone-800' },

  // ── Ocasiones ─────────────────────────────────────────────────────────────
  { id: 'romantico',  label: 'Romántico',   labelEn: 'Romantic',    emoji: '💑', color: 'bg-rose-900/60 text-rose-200',    colorLight: 'bg-rose-100 text-rose-900' },
  { id: 'fiesta',     label: 'Fiesta',      labelEn: 'Party',       emoji: '🎉', color: 'bg-violet-900/60 text-violet-200',colorLight: 'bg-violet-100 text-violet-900' },
  { id: 'relajado',   label: 'Relajado',    labelEn: 'Chill',       emoji: '🌅', color: 'bg-sky-900/60 text-sky-200',      colorLight: 'bg-sky-100 text-sky-900' },
];

/** Mapa de palabras clave (en español e inglés) → tag id */
const KEYWORDS: Record<string, string> = {
  // Ron
  'ron ': 'ron', ' ron': 'ron', 'rum': 'ron', 'rhum': 'ron', 'cachaça': 'ron', 'cachaca': 'ron',
  // Vodka
  'vodka': 'vodka',
  // Tequila
  'tequila': 'tequila', 'mezcal': 'tequila',
  // Gin
  ' gin ': 'gin', ' gin,': 'gin', '\ngin': 'gin', 'ginebra': 'gin',
  // Whisky
  'whisky': 'whisky', 'whiskey': 'whisky', 'bourbon': 'whisky', 'scotch': 'whisky',
  // Vino
  'vino': 'vino', 'wine': 'vino',
  // Champagne
  'champagne': 'champagne', 'prosecco': 'champagne', 'cava': 'champagne', 'espumoso': 'champagne',
  // Cerveza
  'cerveza': 'cerveza', 'beer': 'cerveza', 'lager': 'cerveza', 'michelada': 'cerveza',
  // Licor
  'licor': 'licor', 'liqueur': 'licor', 'amaretto': 'licor', 'baileys': 'licor',
  'cointreau': 'licor', 'triple sec': 'licor', 'kahlúa': 'licor', 'kahlua': 'licor',
  'curacao': 'licor', 'blue curacao': 'licor', 'aperol': 'licor', 'campari': 'licor',
  // Tropical
  'tropical': 'tropical', 'piña': 'tropical', 'pineapple': 'tropical', 'coco': 'tropical',
  'coconut': 'tropical', 'mango': 'tropical', 'maracuyá': 'tropical', 'passion fruit': 'tropical',
  'guayaba': 'tropical', 'guava': 'tropical', 'tamarindo': 'tropical', 'papaya': 'tropical',
  // Cítrico
  'limón': 'citrico', 'lima': 'citrico', 'naranja': 'citrico', 'lemon': 'citrico',
  'lime': 'citrico', 'orange': 'citrico', 'pomelo': 'citrico', 'grapefruit': 'citrico',
  'cítrico': 'citrico', 'citrus': 'citrico', 'toronja': 'citrico',
  // Dulce
  'azúcar': 'dulce', 'jarabe': 'dulce', 'syrup': 'dulce', 'grenadine': 'dulce',
  'granadina': 'dulce', 'dulce': 'dulce', 'sweet': 'dulce', 'caramelo': 'dulce',
  'chocolate': 'dulce', 'vainilla': 'dulce', 'vanilla': 'dulce', 'miel': 'dulce', 'honey': 'dulce',
  // Amargo
  'amargo': 'amargo', 'bitter': 'amargo', 'bitters': 'amargo', 'angostura': 'amargo',
  'aperitivo': 'amargo', 'negroni': 'amargo',
  // Cremoso
  'crema': 'cremoso', 'cream': 'cremoso', 'leche': 'cremoso', 'milk': 'cremoso',
  'helado': 'cremoso', 'ice cream': 'cremoso', 'batido': 'cremoso', 'smoothie': 'cremoso',
  'yogur': 'cremoso',
  // Frozen
  'frozen': 'frozen', 'hielo': 'frozen', 'crushed ice': 'frozen', 'frappe': 'frozen',
  'slushie': 'frozen', 'blended': 'frozen',
  // Picante
  'picante': 'picante', 'jalapeño': 'picante', 'chile': 'picante', 'chili': 'picante',
  'tabasco': 'picante', 'spicy': 'picante', 'sriracha': 'picante', 'jengibre': 'picante',
  'ginger': 'picante',
  // Sin alcohol
  'sin alcohol': 'noalcohol', 'mocktail': 'noalcohol', 'no alcohol': 'noalcohol',
  'non-alcoholic': 'noalcohol', 'alcohol-free': 'noalcohol', 'virgin': 'noalcohol',
  // Clásico
  'mojito': 'clasico', 'margarita': 'clasico', 'cosmopolitan': 'clasico',
  'manhattan': 'clasico', 'old fashioned': 'clasico', 'daiquiri': 'clasico',
  'martini': 'clasico', 'aperol spritz': 'clasico', 'pisco sour': 'clasico',
  // Romántico
  'romántico': 'romantico', 'romantic': 'romantico', 'rose': 'romantico',
  'rosado': 'romantico', 'rosa': 'romantico', 'love': 'romantico', 'amor': 'romantico',
  // Fiesta
  'fiesta': 'fiesta', 'party': 'fiesta', 'colorido': 'fiesta', 'colorful': 'fiesta',
  // Relajado
  'relajante': 'relajado', 'relaxing': 'relajado', 'tranquilo': 'relajado', 'chill': 'relajado',
  'suave': 'relajado', 'smooth': 'relajado',
};

/**
 * Genera un array de tag IDs a partir del nombre y receta del cóctel.
 * Máximo 5 tags, priorizando los más específicos.
 */
export function generateTags(name: string, recipe: string, moodId?: string | null): string[] {
  const text = `${name} ${recipe}`.toLowerCase();
  const found = new Set<string>();

  // Añadir el mood si se usó uno
  const moodToTag: Record<string, string> = {
    romantic: 'romantico', party: 'fiesta', chill: 'relajado',
    noalcohol: 'noalcohol', tropical: 'tropical', classic: 'clasico',
  };
  if (moodId && moodToTag[moodId]) found.add(moodToTag[moodId]);

  // Escanear keywords
  for (const [kw, tagId] of Object.entries(KEYWORDS)) {
    if (text.includes(kw)) found.add(tagId);
    if (found.size >= 5) break;
  }

  // Eliminar duplicados semánticos (si hay 'tropical' no añadir 'relajado', etc.)
  const arr = [...found];

  // Limitar a 5 tags
  return arr.slice(0, 5);
}

/** Obtiene el objeto Tag completo a partir de un id */
export function getTagById(id: string): Tag | undefined {
  return ALL_TAGS.find((t) => t.id === id);
}
