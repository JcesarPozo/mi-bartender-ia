import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { generateTags } from '@/lib/autoTags';

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractCocktailName(text: string): string | null {
  const clean = (s: string) =>
    s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[🍹🍸🥂]/g, '').trim();

  // 1. Línea COCTEL:
  const p1 = text.match(/^C[OÓ]CTEL\s*:\s*(.+)$/mi);
  if (p1?.[1]?.trim()) return clean(p1[1]);

  // 2. Encabezado markdown con emoji
  const p2 = text.match(/^#{1,3}\s*[🍹🍸🥂]?\s*\*{0,2}([^*\n]{3,60})\*{0,2}\s*$/m);
  if (p2?.[1]?.trim()) return clean(p2[1]);

  // 3. Primer **negrita** en su propia línea
  const p3 = text.match(/^\*\*([^*\n]{3,50})\*\*\s*$/m);
  if (p3?.[1]?.trim()) return clean(p3[1]);

  // 4. Primera línea no vacía que no sea un bullet ni número
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (/^[-*#\d]/.test(line)) continue;
    if (/^(ingredientes|preparation|steps|instrucciones)/i.test(line)) continue;
    const c = clean(line);
    if (c.length >= 3 && c.length <= 60) return c;
  }
  return null;
}

function extractImageLine(text: string): string | null {
  const p = text.match(/^IMAGE\s*:\s*(.+)$/mi);
  if (p?.[1]) return p[1].replace(/^["'`]|["'`]$/g, '').trim();
  return null;
}

const PHOTO_SUFFIX = 'professional cocktail photography, studio lighting, bokeh background, photorealistic, 4k, sharp focus';

const GLASS_MAP: [RegExp, string][] = [
  [/taza\s*de\s*cobre|copper\s*mug|mule\s*mug/gi, 'copper mug'],
  [/copa\s*de\s*martini|martini\s*glass/gi,        'martini glass'],
  [/copa\s*champán|champagne|flauta/gi,             'champagne flute'],
  [/vaso\s*highball|highball/gi,                   'highball glass'],
  [/rocks|old[\s-]fashion/gi,                      'rocks glass'],
  [/copa\s*vino|wine\s*glass/gi,                   'wine glass'],
  [/coupe/gi,                                      'coupe glass'],
  [/tiki/gi,                                       'tiki mug'],
];

function buildImagePrompt(keywords: string | null, recipe: string, name: string | null): string {
  if (keywords && keywords.length > 10) return `${keywords}, ${PHOTO_SUFFIX}`;

  let glass = '';
  for (const [regex, en] of GLASS_MAP) {
    if (regex.test(recipe)) { glass = `in a ${en}`; break; }
  }
  if (!glass) glass = 'in an elegant glass';

  const garnishRe = /(?:decora|garnish|guarnición|rodaja|slice|twist|sprig|rama|menta|cherry|cereza|naranja|limón|lima)\s*(?:de\s*)?([^.,\n]{3,30})/gi;
  const garnishMatch = garnishRe.exec(recipe);
  const garnish = garnishMatch ? `, garnished with ${garnishMatch[0].substring(0, 30)}` : '';

  return `${name || 'cocktail'} cocktail drink ${glass}${garnish}, dark moody bar, ${PHOTO_SUFFIX}`;
}

// Detecta si una línea es cabecera interna (no debe emitirse al cliente)
function isHeaderLine(line: string): boolean {
  return /^C[OÓ]CTEL\s*:/i.test(line) || /^IMAGE\s*:/i.test(line);
}

// ── Endpoint ──────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const emit = (ctrl: ReadableStreamDefaultController, data: object) =>
    ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  if (!process.env.OPENROUTER_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new Response(JSON.stringify({ error: 'Servidor no configurado' }), { status: 500 });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // Límite plan free
  const { data: subData } = await supabase
    .from('user_subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle();
  const isPremium = subData?.plan === 'premium' && subData?.status === 'active';
  if (!isPremium) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('cocktails_invented').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', startOfDay.toISOString());
    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: 'LIMIT_REACHED', limit: 5 }), { status: 429 });
    }
  }

  const { prompt, shouldSave = true, locale = 'es', moodId = null } = await req.json();
  const isEnglish = locale === 'en';

  const systemPrompt = isEnglish
    ? `You are an expert creative bartender. ALWAYS RESPOND IN ENGLISH.

Start EVERY response with these two lines FIRST, before anything else:
COCTEL: [cocktail name in English]
IMAGE: [10-15 word visual description in English: real drink color, exact glass type like "copper mug" or "martini glass", garnish, lighting]

Then write the complete recipe in Markdown in English.`
    : `Eres un bartender experto y creativo. RESPONDE SIEMPRE EN ESPAÑOL.

Comienza CADA respuesta con estas dos líneas PRIMERO, antes que cualquier otra cosa:
COCTEL: [nombre del cóctel]
IMAGE: [descripción visual en inglés, 10-15 palabras: color real, vaso exacto como "copper mug" o "martini glass", guarnición, iluminación]

Luego escribe la receta completa en Markdown en español.`;

  const FREE_MODELS = [
    'tencent/hy3-preview:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-120b:free',
    'openrouter/owl-alpha',
    'openrouter/free',
  ];

  const userMsg = isEnglish
    ? `${prompt}\n\n[IMPORTANT: Start with COCTEL: and IMAGE: lines first. Respond ENTIRELY in English.]`
    : `${prompt}\n\n[IMPORTANTE: Empieza con las líneas COCTEL: e IMAGE: primero. Responde COMPLETAMENTE en español.]`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Intentar modelos en orden hasta que uno responda
        let completion: AsyncIterable<any> | null = null;
        let lastError: any;

        for (const model of FREE_MODELS) {
          try {
            console.log(`[chat] Intentando: ${model}`);
            const openrouter = new OpenAI({
              baseURL: 'https://openrouter.ai/api/v1',
              apiKey: process.env.OPENROUTER_API_KEY,
              defaultHeaders: {
                'HTTP-Referer': 'https://mi-bartender-ia.vercel.app',
                'X-Title': 'Mi Bartender IA',
              },
            });
            completion = await openrouter.chat.completions.create({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMsg },
              ],
              temperature: 0.8,
              stream: true,
            });
            break;
          } catch (err: any) {
            lastError = err;
            const skip = err.status === 429 || err.status === 404
              || /429|404|rate.?limit|no endpoint|provider returned/i.test(err.message || '');
            if (skip) { console.warn(`[chat] ${model} → skip (${err.status})`); continue; }
            throw err;
          }
        }

        if (!completion) throw lastError || new Error('Todos los modelos no disponibles');

        // ── STREAMING REAL con filtro línea a línea ────────────────────────
        let lineBuffer   = '';   // línea en construcción (aún no llegó \n)
        let fullRecipe   = '';   // receta limpia acumulada
        let cocktailName: string | null = null;
        let imageKeywords: string | null = null;
        let recipeStarted = false; // para añadir nombre al inicio si falta

        const processLine = (line: string) => {
          if (isHeaderLine(line)) {
            // Extraer metadatos pero NO emitir al cliente
            if (!cocktailName) cocktailName = extractCocktailName(line);
            if (!imageKeywords) imageKeywords = extractImageLine(line);
            return;
          }
          // Inyectar encabezado del nombre una sola vez, antes de la primera línea real
          if (!recipeStarted && cocktailName && line.trim()) {
            const nameAlreadyInLine = line.toLowerCase().includes(cocktailName.toLowerCase().substring(0, 5));
            if (!nameAlreadyInLine) {
              const header = `### 🍹 ${cocktailName}\n\n`;
              fullRecipe += header;
              emit(controller, { type: 'token', text: header });
            }
            recipeStarted = true;
          } else if (!recipeStarted && line.trim()) {
            recipeStarted = true;
          }
          fullRecipe += line + '\n';
          emit(controller, { type: 'token', text: line + '\n' });
        };

        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (!token) continue;

          lineBuffer += token;

          // Procesar todas las líneas completas del buffer
          const parts = lineBuffer.split('\n');
          lineBuffer = parts.pop() ?? ''; // la última parte es la línea incompleta

          for (const line of parts) {
            processLine(line);
          }
        }

        // Procesar cualquier resto sin newline al final
        if (lineBuffer) processLine(lineBuffer);

        // Si nunca extrajimos el nombre, intentar de la receta completa
        if (!cocktailName) cocktailName = extractCocktailName(fullRecipe);

        const imagePrompt = buildImagePrompt(imageKeywords, fullRecipe, cocktailName);

        // ── Guardar en Supabase ─────────────────────────────────────────────
        let cocktailId: string | null = null;
        let jobId: string | null = null;

        if (cocktailName && shouldSave) {
          const { data: existing } = await supabase
            .from('cocktails_invented').select('id')
            .eq('name', cocktailName).eq('user_id', user.id).maybeSingle();

          if (existing) {
            cocktailId = existing.id;
          } else {
            const { data: newC } = await supabase
              .from('cocktails_invented')
              .insert({
                name: cocktailName, recipe: fullRecipe, image_path: null,
                user_id: user.id, rating: 0,
                tags: generateTags(cocktailName, fullRecipe, moodId),
              })
              .select().single();
            if (newC) {
              cocktailId = newC.id;
              const { data: newJob } = await supabase
                .from('cocktail_jobs')
                .insert({
                  user_id: user.id, name: cocktailName, recipe: fullRecipe,
                  image_prompt: imagePrompt, status: 'pending',
                  image_path: null, error: null,
                })
                .select().single();
              if (newJob) jobId = newJob.id;
            }
          }
        }

        emit(controller, { type: 'done', cocktailId, jobId, cocktailName, imagePrompt });

      } catch (err: any) {
        console.error('[chat/stream]', err.message);
        emit(controller, { type: 'error', message: err.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
