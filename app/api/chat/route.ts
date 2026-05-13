import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { generateTags } from '@/lib/autoTags';

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractCocktailName(text: string): string | null {
  const clean = (s: string) =>
    s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/[🍹🍸🥂#]/g, '').trim();
  const p1 = text.match(/^C[OÓ]CTEL\s*:\s*(.+)$/mi);
  if (p1) return clean(p1[1]);
  const p2 = text.match(/^#{1,3}\s*[🍹🍸🥂]?\s*\*{0,2}([^*\n]+)\*{0,2}\s*$/m);
  if (p2) return clean(p2[1]);
  const p3 = text.match(/^\*\*([^*\n]{3,50})\*\*\s*$/m);
  if (p3) return clean(p3[1]);
  return null;
}

function extractImageLine(text: string): string | null {
  const p = text.match(/^IMAGE\s*:\s*(.+)$/mi);
  if (p) return p[1].replace(/^["'`]|["'`]$/g, '').trim();
  return null;
}

function extractIngredientsForImage(text: string): string {
  const section = text.match(/ingredientes?[:\s]*\n([\s\S]*?)(?:\n#{1,3}|\n\*\*preparaci)/mi);
  if (!section) return '';
  return section[1]
    .split('\n').slice(0, 4)
    .map(l => l.replace(/^[-*•\s\d.]+/, '').replace(/\d+ml|\d+oz|\d+cl/gi, '').trim())
    .filter(Boolean).join(', ');
}

// Mapeo de vasos español → inglés para el prompt de imagen
const GLASS_MAP: [RegExp, string][] = [
  [/taza\s+de\s+cobre|mule\s+mug/gi,          'copper mug'],
  [/copa\s+de\s+martini|martini/gi,            'martini glass'],
  [/copa\s+de\s+champán|champagne|flauta/gi,   'champagne flute'],
  [/vaso\s+highball|highball/gi,               'highball glass'],
  [/vaso\s+rocks|old[\s-]fashioned|whisky/gi,  'rocks glass'],
  [/copa\s+de\s+vino|wine\s+glass/gi,          'wine glass'],
  [/copa\s+coupe|coupe/gi,                     'coupe glass'],
  [/tiki|tropical\s+cup/gi,                    'tiki mug'],
  [/jarra|pitcher/gi,                          'pitcher glass'],
  [/shot|chupito/gi,                           'shot glass'],
  [/snifter|brandy/gi,                         'brandy snifter'],
];

function extractGlassFromRecipe(text: string): string {
  for (const [regex, english] of GLASS_MAP) {
    if (regex.test(text)) return english;
  }
  return '';
}

function extractGarnishFromRecipe(text: string): string {
  const keywords: [RegExp, string][] = [
    [/cereza|cherry/gi,             'maraschino cherry'],
    [/rodaja\s+de\s+lima|lime\s+wheel/gi, 'lime wheel'],
    [/cu\xf1a\s+de\s+lima|lime\s+wedge/gi, 'lime wedge'],
    [/rodaja\s+de\s+lim\xf3n|lemon\s+wheel/gi, 'lemon wheel'],
    [/twist\s+de\s+naranja|orange\s+twist/gi, 'orange twist'],
    [/rodaja\s+de\s+naranja|orange\s+slice/gi, 'orange slice'],
    [/rama\s+de\s+menta|sprig\s+of\s+mint|menta\s+fresca/gi, 'fresh mint sprig'],
    [/sal\s+en\s+el\s+borde|salt\s+rim/gi, 'salt rim'],
    [/az\xfacar\s+en\s+el\s+borde|sugar\s+rim/gi, 'sugar rim'],
    [/canela|cinnamon/gi,           'cinnamon stick'],
    [/coco\s+rallado|coconut/gi,    'coconut flakes'],
    [/flor\s+comestible|edible\s+flower/gi, 'edible flower'],
    [/pi\xf1a|pineapple/gi,         'pineapple slice'],
    [/apio|celery/gi,               'celery stalk'],
  ];
  const found: string[] = [];
  for (const [regex, english] of keywords) {
    if (regex.test(text) && !found.includes(english)) found.push(english);
  }
  return found.slice(0, 3).join(', ');
}

const PHOTO_SUFFIX = 'professional cocktail photography, studio lighting, bokeh background, photorealistic, 4k, sharp focus';

function buildFinalImagePrompt(
  imageKeywordsFromModel: string | null,
  recipeText: string,
  cocktailName: string | null,
): string {
  // Si el modelo dio IMAGE: con keywords, usarlos directamente (ya en inglés)
  if (imageKeywordsFromModel && imageKeywordsFromModel.length > 10) {
    return `${imageKeywordsFromModel}, ${PHOTO_SUFFIX}`;
  }

  // Si no, construir desde la receta
  const glass      = extractGlassFromRecipe(recipeText);
  const garnish    = extractGarnishFromRecipe(recipeText);
  const ingredients = extractIngredientsForImage(recipeText);
  const glassStr   = glass   ? `in a ${glass}` : 'in an elegant glass';
  const garnishStr = garnish ? `, garnished with ${garnish}` : '';
  const base       = ingredients
    ? `cocktail drink with ${ingredients} ${glassStr}${garnishStr}, dark moody bar`
    : `${cocktailName || 'tropical'} cocktail ${glassStr}${garnishStr}, dark moody bar`;

  return `${base}, ${PHOTO_SUFFIX}`;
}

// Limpiar el texto de cabeceras COCTEL: / IMAGE:
function cleanRecipeText(raw: string): string {
  return raw
    .replace(/^C[OÓ]CTEL\s*:\s*.+$/gmi, '')
    .replace(/^IMAGE\s*:\s*.+$/gmi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimStart();
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
    ? `You are an expert creative bartender. YOU MUST ALWAYS RESPOND IN ENGLISH. NEVER use Spanish.
tone: creative | visionary

MANDATORY FORMAT — start EVERY response with exactly these two lines (FIRST, before anything else):
COCTEL: [cocktail name in English]
IMAGE: [visual description in English, 10-15 words — real color, exact glass type like "copper mug" or "martini glass", visible garnish, mood]

Then write the complete recipe in Markdown IN ENGLISH.`
    : `Eres un bartender experto y creativo. DEBES RESPONDER SIEMPRE EN ESPAÑOL. NUNCA uses inglés en la receta.

FORMATO OBLIGATORIO — comienza SIEMPRE con exactamente estas dos líneas (LO PRIMERO DE TODO, antes que nada):
COCTEL: [nombre del cóctel]
IMAGE: [descripción visual en inglés, 10-15 palabras — color real, tipo de vaso exacto como "copper mug" o "martini glass", guarnición visible, iluminación]

Luego escribe la receta completa en Markdown EN ESPAÑOL.`;

  const openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://mi-bartender-ia.vercel.app',
      'X-Title': 'Mi Bartender IA',
    },
    timeout: 30000,
  });

  // Modelos gratuitos en orden de velocidad (MoE primero = más rápidos)
  // Si uno da 429/404, se prueba el siguiente automáticamente
  const FREE_MODELS = [
    'tencent/hy3-preview:free',              // MoE 12B activos — muy rápido
    'nvidia/nemotron-3-super-120b-a12b:free',// MoE 12B activos — 50% más rápido que media
    'meta-llama/llama-3.3-70b-instruct:free',// sólido, buen español
    'openai/gpt-oss-120b:free',              // MoE OpenAI OSS
    'openrouter/owl-alpha',                  // siempre disponible, sin :free
    'openrouter/free',                       // fallback final: elige el que esté libre
  ];

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    {
      role: 'user' as const,
      content: isEnglish
        ? `${prompt}\n\n[Respond ENTIRELY in English. Start with COCTEL: and IMAGE: lines first.]`
        : `${prompt}\n\n[Responde COMPLETAMENTE en español. Empieza con las líneas COCTEL: e IMAGE: primero.]`,
    },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── FASE 1: intentar modelos en orden hasta que uno responda ────
        let rawText = '';
        let usedModel = '';
        let lastError: any;

        for (const model of FREE_MODELS) {
          try {
            console.log(`[chat] Intentando modelo: ${model}`);
            const completion = await openrouter.chat.completions.create({
              model,
              messages,
              temperature: 0.8,
              stream: true,
            });
            for await (const chunk of completion) {
              rawText += chunk.choices[0]?.delta?.content || '';
            }
            usedModel = model;
            break; // éxito — salir del bucle
          } catch (err: any) {
            lastError = err;
            const is429or404 = err.status === 429
              || err.status === 404
              || err.message?.includes('429')
              || err.message?.includes('404')
              || err.message?.toLowerCase().includes('rate limit')
              || err.message?.toLowerCase().includes('no endpoints found')
              || err.message?.toLowerCase().includes('provider returned error');
            if (is429or404) {
              console.warn(`[chat] ${model} → ${err.status || 'error'}, probando siguiente...`);
              rawText = '';
              continue;
            }
            throw err; // error distinto a 429, relanzar
          }
        }

        if (!rawText) {
          throw lastError || new Error('Todos los modelos están saturados. Intenta en unos segundos.');
        }

        console.log(`[chat] Respuesta obtenida con: ${usedModel}`);

        const cocktailName  = extractCocktailName(rawText);
        const imageKeywords = extractImageLine(rawText);
        let   cleanRecipe   = cleanRecipeText(rawText);

        // Añadir el nombre como header si no aparece en la receta limpia
        const nameInRecipe = cocktailName &&
          cleanRecipe.toLowerCase().includes(cocktailName.toLowerCase().substring(0, 6));
        if (cocktailName && !nameInRecipe) {
          cleanRecipe = `### 🍹 ${cocktailName}\n\n${cleanRecipe}`;
        }

        const imagePrompt = buildFinalImagePrompt(imageKeywords, cleanRecipe, cocktailName);

        // ── FASE 3: guardar en Supabase ──────────────────────────────────
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
                name: cocktailName, recipe: cleanRecipe, image_path: null,
                user_id: user.id, rating: 0,
                tags: generateTags(cocktailName, cleanRecipe, moodId),
              })
              .select().single();
            if (newC) {
              cocktailId = newC.id;
              const { data: newJob } = await supabase
                .from('cocktail_jobs')
                .insert({
                  user_id: user.id, name: cocktailName, recipe: cleanRecipe,
                  image_prompt: imagePrompt, status: 'pending',
                  image_path: null, error: null,
                })
                .select().single();
              if (newJob) jobId = newJob.id;
            }
          }
        }

        // ── FASE 4: hacer streaming del texto limpio ─────────────────────
        // Dividir en palabras para el efecto de aparición progresiva
        const words = cleanRecipe.split(/(\s+)/);
        const BATCH = 4; // palabras por emit
        for (let i = 0; i < words.length; i += BATCH) {
          const chunk = words.slice(i, i + BATCH).join('');
          if (chunk) emit(controller, { type: 'token', text: chunk });
        }

        // Evento final con metadata
        emit(controller, {
          type: 'done',
          cocktailId,
          jobId,
          cocktailName,
          imagePrompt,
        });

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
