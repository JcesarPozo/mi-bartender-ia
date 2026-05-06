/**
 * buildImagePrompt.ts
 * Extrae guarniciones de la receta (en español o inglés) y construye
 * un prompt de imagen con ellas al FRENTE para que Pollinations las priorice.
 */

const GARNISH_KEYWORDS = [
  // acciones de decoración
  'decora', 'decorar', 'adorna', 'adornar', 'garnish', 'guarnición',
  'sirve con', 'servir con', 'agrega encima', 'añade encima', 'coloca encima',
  // elementos visuales
  'rodaja', 'slice', 'twist', 'wedge', 'sprig', 'rama', 'borde',
  // frutas y especias comunes
  'cereza', 'cherry', 'piña', 'pineapple',
  'naranja', 'orange', 'limón', 'lemon', 'lima', 'lime',
  'menta', 'mint', 'hierbabuena',
  'canela', 'cinnamon',
  'coco', 'coconut',
  'pepino', 'cucumber',
  'frambuesa', 'raspberry',
  'fresa', 'strawberry',
  'arándano', 'blueberry',
  'maracuyá', 'passion fruit',
  'flor', 'flower',
  // bordes
  'sal', 'salt rim', 'azúcar', 'sugar rim',
];

/** Traducciones ES→EN de guarniciones al inglés para Pollinations */
const TRANSLATIONS: [string, string][] = [
  ['rodaja de piña',    'pineapple slice'],
  ['piña',              'pineapple slice'],
  ['rodaja de naranja', 'orange slice'],
  ['naranja',           'orange slice'],
  ['rodaja de limón',   'lemon slice'],
  ['limón',             'lemon wedge'],
  ['rodaja de lima',    'lime slice'],
  ['lima',              'lime wedge'],
  ['cereza',            'maraschino cherry'],
  ['cerezas',           'maraschino cherries'],
  ['hierbabuena',       'fresh mint leaves'],
  ['menta',             'fresh mint sprig'],
  ['borde de sal',      'salt rim'],
  ['sal en el borde',   'salt rim'],
  ['borde de azúcar',   'sugar rim'],
  ['azúcar en el borde','sugar rim'],
  ['rama de canela',    'cinnamon stick'],
  ['canela',            'cinnamon stick'],
  ['coco rallado',      'shredded coconut rim'],
  ['coco',              'coconut flakes'],
  ['twist de naranja',  'orange twist'],
  ['twist de limón',    'lemon twist'],
  ['flor comestible',   'edible flower'],
  ['flor',              'edible flower'],
  ['pepino',            'cucumber slice'],
  ['frambuesa',         'raspberry'],
  ['fresas',            'strawberry slices'],
  ['fresa',             'strawberry slice'],
  ['arándano',          'blueberry'],
  ['maracuyá',          'passion fruit half'],
];

/**
 * Extrae guarniciones/decoraciones de la receta y las devuelve en inglés.
 * Funciona con recetas en español e inglés.
 */
export function extractGarnishes(recipe: string): string[] {
  const lines = recipe.split('\n');
  const matchedLines: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (GARNISH_KEYWORDS.some((kw) => lower.includes(kw))) {
      const clean = line
        .replace(/^[-*•\s\d.]+/, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .trim()
        .toLowerCase();
      if (clean.length > 3 && clean.length < 120) {
        matchedLines.push(clean);
      }
    }
  }

  if (matchedLines.length === 0) return [];

  const allText = matchedLines.join(' ');
  const garnishEn: string[] = [];

  for (const [es, en] of TRANSLATIONS) {
    if (allText.includes(es) && !garnishEn.includes(en)) {
      garnishEn.push(en);
    }
  }

  return garnishEn.slice(0, 5);
}

/**
 * Construye el prompt final para Pollinations.
 * Las guarniciones van AL FRENTE para que el modelo las priorice.
 *
 * Ejemplo de salida:
 * "pineapple slice and maraschino cherry garnished tropical piña colada cocktail
 *  in hurricane glass, yellow creamy, tropical beach bar,
 *  professional cocktail photography, studio lighting, bokeh background, photorealistic, 4k, sharp focus"
 */
export function buildImagePrompt(
  cocktailName: string,
  recipe: string,
  imageKeywords?: string | null,
): string {
  const suffix =
    'professional cocktail photography, studio lighting, bokeh background, photorealistic, 4k, sharp focus';

  const garnishes = extractGarnishes(recipe);

  // Base: usa las keywords del modelo si existen, o construye desde el nombre
  const base = imageKeywords?.trim()
    ? imageKeywords.trim()
    : `${cocktailName} cocktail drink, elegant glass, dark moody bar`;

  if (garnishes.length > 0) {
    // Filtrar garnishes que ya estén mencionados en la base (evitar duplicados)
    const baseLower = base.toLowerCase();
    const newGarnishes = garnishes.filter(
      (g) => !baseLower.includes(g.split(' ')[0])
    );

    if (newGarnishes.length > 0) {
      const garnishStr = newGarnishes.join(' and ');
      // Formato: "[garnish] garnished [base description], [photo suffix]"
      return `${garnishStr} garnished ${base}, ${suffix}`;
    }
  }

  return `${base}, ${suffix}`;
}
