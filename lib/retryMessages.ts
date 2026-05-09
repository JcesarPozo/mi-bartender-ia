/**
 * lib/retryMessages.ts
 * Mensajes graciosos de bartender que se muestran al reintentar una petición fallida.
 */

export interface RetryMessage {
  emoji: string;
  es: string;
  en: string;
}

export const RETRY_MESSAGES: RetryMessage[] = [
  { emoji: '🤦', es: '¡Se me cayó el vaso! Dame un segundo que lo recojo...', en: "Whoops, dropped the glass! Give me a second..." },
  { emoji: '🍾', es: '¡Caramba, se me acabó el ron! Voy a la bodega a buscar más...', en: "Ran out of rum! Heading to the cellar for more..." },
  { emoji: '🔥', es: '¡Ay, se quemó la guarnición! Reintentando con más cuidado...', en: "Oops, burned the garnish! Trying more carefully this time..." },
  { emoji: '🧊', es: 'Se derritió el hielo antes de tiempo... Recargando la hielera...', en: "Ice melted too fast... Refilling the ice bucket..." },
  { emoji: '🍋', es: '¡Se me escapó el limón rodando! Un momento, que lo cazo...', en: "The lemon rolled away! Just a sec, catching it..." },
  { emoji: '🥴', es: 'Ups, confundí la sal con el azúcar... Empezando de nuevo...', en: "Oops, mixed up the salt and sugar... Starting fresh..." },
  { emoji: '😅', es: '¡La coctelera voló por los aires! Recomponiendo la situación...', en: "The shaker went flying! Pulling myself together..." },
  { emoji: '🐛', es: 'Encontré un bicho en la menta... Buscando hojas frescas...', en: "Found a bug in the mint... Grabbing fresh leaves..." },
];

/** Devuelve un mensaje aleatorio (que no sea el mismo que el anterior) */
export function getRetryMessage(prevIndex: number | null, locale: 'es' | 'en'): { msg: string; index: number } {
  let idx: number;
  do { idx = Math.floor(Math.random() * RETRY_MESSAGES.length); }
  while (idx === prevIndex && RETRY_MESSAGES.length > 1);
  const m = RETRY_MESSAGES[idx];
  return { msg: `${m.emoji} ${locale === 'en' ? m.en : m.es}`, index: idx };
}

/** Detecta si una respuesta streameada salió mal */
export function isResponseBad(text: string): boolean {
  const clean = text.replace(/[#*`\s]/g, '');
  // Consideramos mala si: muy corta, vacía, o sin ingredientes/pasos
  if (clean.length < 80) return true;
  const hasIngredients = /ingrediente|ingredient|ml|oz|cl|cup|medida/i.test(text);
  const hasSteps = /prepara|mezcla|agita|bate|sirve|pour|shake|mix|stir/i.test(text);
  if (!hasIngredients && !hasSteps) return true;
  return false;
}
