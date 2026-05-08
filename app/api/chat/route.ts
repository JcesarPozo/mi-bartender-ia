// app/api/chat/route.ts
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { generateTags } from '@/lib/autoTags';

// ── Helpers de extracción (sin cambios) ──────────────────────────────────────
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
  const p1 = text.match(/^IMAGE\s*:\s*(.+)$/mi);
  if (p1) return p1[1].replace(/^["'`]|["'`]$/g, '').trim();
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

function extractGarnishFromRecipe(text: string): string {
  const lines = text.split('\n');
  const keywords = [
    'decora','garnish','guarnición','adorna','sirve con','rodaja','slice','twist',
    'wedge','sprig','rama','cereza','cherry','piña','pineapple','naranja','orange',
    'limón','lemon','lima','lime','menta','mint','canela','cinnamon','sal','salt',
    'azúcar','sugar rim','coco','coconut','flor','flower','hierba','herb',
  ];
  const found: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some(kw => lower.includes(kw))) {
      const clean = line.replace(/^[-*•\s\d.]+/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (clean.length > 3 && clean.length < 80) found.push(clean);
    }
  }
  const tr: Record<string, string> = {
    'cereza': 'maraschino cherry', 'cerezas': 'maraschino cherries',
    'rodaja de piña': 'pineapple slice', 'piña': 'pineapple slice',
    'rodaja de naranja': 'orange slice', 'naranja': 'orange slice',
    'rodaja de limón': 'lemon slice', 'limón': 'lemon slice',
    'rodaja de lima': 'lime slice', 'lima': 'lime wedge',
    'menta': 'fresh mint sprig', 'hierbabuena': 'fresh mint leaves',
    'sal en el borde': 'salt rim', 'borde de sal': 'salt rim',
    'azúcar en el borde': 'sugar rim', 'borde de azúcar': 'sugar rim',
    'canela': 'cinnamon stick', 'rama de canela': 'cinnamon stick',
    'coco rallado': 'shredded coconut rim', 'coco': 'coconut flakes',
    'twist de naranja': 'orange twist', 'twist de limón': 'lemon twist',
    'flor comestible': 'edible flower', 'flor': 'edible flower',
  };
  const garnishEn: string[] = [];
  const allText = found.join(' ').toLowerCase();
  for (const [es, en] of Object.entries(tr)) {
    if (allText.includes(es) && !garnishEn.includes(en)) garnishEn.push(en);
  }
  return garnishEn.slice(0, 4).join(', ');
}

const PHOTO_SUFFIX = 'professional cocktail photography, studio lighting, bokeh background, photorealistic, 4k, sharp focus';

function buildFinalImagePrompt(imageKeywords: string | null, recipeText: string, cocktailName: string | null): string {
  if (imageKeywords) {
    const base = imageKeywords.toLowerCase();
    const garnish = extractGarnishFromRecipe(recipeText);
    const missing = garnish.split(', ').filter(g => g && !base.includes(g.split(' ')[0])).join(', ');
    return `${missing ? `${imageKeywords}, ${missing}` : imageKeywords}, ${PHOTO_SUFFIX}`;
  }
  const ingredients = extractIngredientsForImage(recipeText);
  const garnish = extractGarnishFromRecipe(recipeText);
  const garnishPart = garnish ? `, garnished with ${garnish}` : '';
  return ingredients
    ? `cocktail drink with ${ingredients}${garnishPart}, elegant glass, dark moody bar, ${PHOTO_SUFFIX}`
    : `${cocktailName || 'tropical'} cocktail drink${garnishPart}, elegant glass, dark moody bar, ${PHOTO_SUFFIX}`;
}

// ── Endpoint principal ───────────────────────────────────────────────────────
export async function POST(req: Request) {
  const encoder = new TextEncoder();

  // Helper para emitir eventos SSE
  const emit = (controller: ReadableStreamDefaultController, data: object) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  // Validar entorno
  if (!process.env.OPENROUTER_API_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: 'Servidor no configurado' }), { status: 500 });
  }

  // Auth
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

  // Verificar límite (plan free)
  const { data: subData } = await supabase
    .from('user_subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle();
  const isPremium = subData?.plan === 'premium' && subData?.status === 'active';
  if (!isPremium) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('cocktails_invented').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', startOfDay.toISOString());
    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: 'LIMIT_REACHED', todayCount: count, limit: 5 }), { status: 429 });
    }
  }

  const { prompt, shouldSave = true, locale = 'es', moodId = null } = await req.json();
  const isEnglish = locale === 'en';

  const systemPrompt = isEnglish ? `You are an expert and creative bartender. Always respond in English.

MANDATORY: Your response must ALWAYS start with these two lines:
COCTEL: [cocktail name]
IMAGE: [VERY specific visual description in English, 10-15 words]

Rules for IMAGE: mention REAL COLOR, EXACT GLASS TYPE, visible GARNISH, ATMOSPHERE. Only English, no quotes.

Then write the full recipe in Markdown.`
  : `Eres un bartender experto y creativo. Responde siempre en español.

OBLIGATORIO: Tu respuesta debe comenzar SIEMPRE con estas dos líneas:
COCTEL: [nombre del cóctel]
IMAGE: [descripción visual MUY específica en inglés, 10-15 palabras]

Reglas para IMAGE: menciona COLOR REAL, TIPO DE VASO exacto, GUARNICIÓN visible, AMBIENTE. Solo inglés, sin comillas.

Luego escribe la receta completa en Markdown.`;

  const openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://mi-bartender-ia.vercel.app',
      'X-Title': 'Mi Bartender IA',
    },
  });

  // ── Stream principal ─────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openrouter.chat.completions.create({
          model: 'openrouter/free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          stream: true,
        });

        let rawBuffer   = '';   // acumula hasta parsear cabeceras
        let fullRecipe  = '';   // receta limpia (sin COCTEL/IMAGE)
        let headersDone = false;
        let cocktailName: string | null = null;
        let imageKeywords: string | null = null;

        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (!token) continue;

          if (!headersDone) {
            // Acumular hasta tener las dos líneas de cabecera o >300 chars
            rawBuffer += token;
            const hasCoctel = /^C[OÓ]CTEL\s*:/mi.test(rawBuffer);
            const hasImage  = /^IMAGE\s*:/mi.test(rawBuffer);

            if ((hasCoctel && hasImage) || rawBuffer.length > 350) {
              cocktailName  = extractCocktailName(rawBuffer);
              imageKeywords = extractImageLine(rawBuffer);
              headersDone   = true;

              // Lo que queda tras las cabeceras, emitirlo ya
              const recipeStart = rawBuffer
                .replace(/^C[OÓ]CTEL\s*:\s*.+\n?/mi, '')
                .replace(/^IMAGE\s*:\s*.+\n?/mi, '')
                .trimStart();

              if (recipeStart) {
                fullRecipe += recipeStart;
                emit(controller, { type: 'token', text: recipeStart });
              }
            }
          } else {
            fullRecipe += token;
            emit(controller, { type: 'token', text: token });
          }
        }

        // Si el modelo no incluyó el nombre en la receta, lo añadimos
        if (cocktailName && !fullRecipe.toLowerCase().includes(cocktailName.toLowerCase().substring(0, 8))) {
          const header = `### 🍹 ${cocktailName}\n\n`;
          fullRecipe = header + fullRecipe;
          // Notificar al cliente que hay un prefijo (lo insertamos al inicio)
          emit(controller, { type: 'prefix', text: header });
        }

        const imagePrompt = buildFinalImagePrompt(imageKeywords, fullRecipe, cocktailName);

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
            const { data: newCocktail } = await supabase
              .from('cocktails_invented')
              .insert({ name: cocktailName, recipe: fullRecipe, image_path: null, user_id: user.id, rating: 0, tags: generateTags(cocktailName, fullRecipe, moodId) })
              .select().single();
            if (newCocktail) {
              cocktailId = newCocktail.id;
              const { data: newJob } = await supabase
                .from('cocktail_jobs')
                .insert({ user_id: user.id, name: cocktailName, recipe: fullRecipe, image_prompt: imagePrompt, status: 'pending', image_path: null, error: null })
                .select().single();
              if (newJob) jobId = newJob.id;
            }
          }
        }

        // Evento final con metadata
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
      'X-Accel-Buffering': 'no', // desactiva buffering en Nginx/Vercel
    },
  });
}
