import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { generateTags } from '@/lib/autoTags';

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractCocktailName(text: string): string | null {
  const clean = (s: string) => s.replace(/\*\*/g,'').replace(/\*/g,'').replace(/[🍹🍸🥂]/g,'').trim();
  const p1 = text.match(/^C[OÓ]CTEL\s*:\s*(.+)$/mi);      if (p1?.[1]?.trim()) return clean(p1[1]);
  const p2 = text.match(/^#{1,3}\s*[🍹🍸🥂]?\s*\*{0,2}([^*\n]{3,60})\*{0,2}\s*$/m); if (p2?.[1]?.trim()) return clean(p2[1]);
  const p3 = text.match(/^\*\*([^*\n]{3,50})\*\*\s*$/m);  if (p3?.[1]?.trim()) return clean(p3[1]);
  const lines = text.split('\n').map(l=>l.trim()).filter(Boolean);
  for (const l of lines.slice(0,5)) {
    if (/^[-*#\d]/.test(l) || /^(ingredientes|preparation|instrucciones)/i.test(l)) continue;
    const c = clean(l); if (c.length>=3 && c.length<=60) return c;
  }
  return null;
}

function extractImageLine(text: string): string | null {
  const p = text.match(/^IMAGE\s*:\s*(.+)$/mi);
  return p?.[1] ? p[1].replace(/^["'`]|["'`]$/g,'').trim() : null;
}

const PHOTO_SFX = 'professional cocktail photography, studio lighting, bokeh, photorealistic, 4k';

const GLASS_MAP: [RegExp, string][] = [
  [/taza\s*de\s*cobre|copper\s*mug|mule\s*mug/gi,'copper mug'],
  [/copa\s*martini|martini\s*glass/gi,'martini glass'],
  [/champán|champagne|flauta/gi,'champagne flute'],
  [/highball/gi,'highball glass'],
  [/rocks|old[\s-]fashion/gi,'rocks glass'],
  [/copa\s*vino|wine\s*glass/gi,'wine glass'],
  [/coupe/gi,'coupe glass'],
  [/tiki/gi,'tiki mug'],
];

function buildImagePrompt(kw: string|null, recipe: string, name: string|null): string {
  if (kw && kw.length>10) return `${kw}, ${PHOTO_SFX}`;
  let glass = '';
  for (const [re,en] of GLASS_MAP) { if (re.test(recipe)) { glass=`in a ${en}`; break; } }
  if (!glass) glass='in an elegant glass';
  return `${name||'cocktail'} cocktail drink ${glass}, dark moody bar, ${PHOTO_SFX}`;
}

function isHeaderLine(l: string): boolean {
  return /^C[OÓ]CTEL\s*:/i.test(l) || /^IMAGE\s*:/i.test(l);
}

// ── Prompts con personalidad de bartender ────────────────────────────────────
const SYS_ES = `Eres un bartender experto, apasionado y carismático. RESPONDES SIEMPRE EN ESPAÑOL.

OBLIGATORIO — empieza SIEMPRE con estas 2 líneas exactas antes de todo:
COCTEL: [nombre del cóctel]
IMAGE: [descripción visual en inglés 10-15 palabras: color, vaso exacto ej. "copper mug" o "martini glass", guarnición, iluminación]

Estructura de la receta en Markdown:

1. CONTEXTO — elige solo una opción según el caso:
   - Cóctel CLÁSICO reconocido (Mojito, Negroni, Margarita, Old Fashioned, etc.): escribe 2-3 frases de historia REAL o curiosidad verificable.
   - Cóctel INVENTADO u original (basado en ingredientes, estado de ánimo o petición creativa): NO inventes historia porque no existe. En su lugar explica en 1-2 frases por qué esta combinación de sabores funciona.

2. Ingredientes con viñetas (cantidades exactas, sin tablas)
3. Preparación paso a paso con consejos profesionales del bartender
4. Consejo final: presentación, maridaje o variación sugerida`;

const SYS_EN = `You are an expert, passionate and charismatic bartender. ALWAYS RESPOND IN ENGLISH.

MANDATORY — always start with these 2 exact lines before anything else:
COCTEL: [cocktail name]
IMAGE: [visual description in English 10-15 words: color, exact glass e.g. "copper mug" or "martini glass", garnish, lighting]

Recipe structure in Markdown:

1. CONTEXT — choose only one option based on the case:
   - Well-known CLASSIC cocktail (Mojito, Negroni, Margarita, Old Fashioned, etc.): write 2-3 sentences of REAL history or a verifiable fun fact.
   - INVENTED or original cocktail (based on ingredients, mood or creative request): DO NOT invent history that doesn't exist. Instead explain in 1-2 sentences why this flavor combination works.

2. Ingredients with bullet points (exact amounts, no tables)
3. Step-by-step preparation with professional bartender tips
4. Final tip: presentation, pairing or suggested variation`;

// Modelos de menor a mayor latencia — Promise.any usará el primero que responda
const MODELS = [
  'tencent/hy3-preview:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-120b:free',
  'openrouter/owl-alpha',
  'openrouter/free',
];

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

  // ── Auth (necesaria antes de todo lo demás) ───────────────────────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { prompt, shouldSave = true, locale = 'es', moodId = null } = await req.json();
  const isEnglish = locale === 'en';

  // ── PARALELO: suscripción + conteo del día ────────────────────────────────
  const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
  const [subResult, countResult] = await Promise.all([
    supabase.from('user_subscriptions').select('plan,status').eq('user_id',user.id).maybeSingle(),
    supabase.from('cocktails_invented').select('id',{count:'exact',head:true})
      .eq('user_id',user.id).gte('created_at',startOfDay.toISOString()),
  ]);

  const isPremium = subResult.data?.plan==='premium' && subResult.data?.status==='active';
  if (!isPremium && (countResult.count??0) >= 5) {
    return new Response(JSON.stringify({ error:'LIMIT_REACHED', limit:5 }), { status:429 });
  }

  const systemPrompt = isEnglish ? SYS_EN : SYS_ES;
  const userMsg = isEnglish
    ? `${prompt}\n[Reply in English. COCTEL: and IMAGE: lines first.]`
    : `${prompt}\n[Responde en español. Líneas COCTEL: e IMAGE: primero.]`;
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user'   as const, content: userMsg },
  ];

  // ── Crear cliente OpenRouter ──────────────────────────────────────────────
  const openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://mi-bartender-ia.vercel.app',
      'X-Title': 'Mi Bartender IA',
    },
  });

  // Helper: intenta un modelo, rechaza si 429/404
  const tryModel = async (model: string) => {
    const stream = await openrouter.chat.completions.create({
      model, messages, temperature: 0.75, max_tokens: 1500, stream: true,
    });
    return { stream, model };
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── CARRERA: Promise.any lanza los 3 primeros en paralelo ──────────
        // El primero que conecte gana; los demás se abandonan automáticamente
        let winner: { stream: any; model: string };
        try {
          winner = await Promise.any(
            MODELS.slice(0,3).map(m => tryModel(m))
          );
        } catch {
          // Si los 3 primeros fallan, intentar los restantes secuencialmente
          let lastErr: any;
          winner = { stream: null, model: '' };
          for (const m of MODELS.slice(3)) {
            try { winner = await tryModel(m); break; }
            catch (e) { lastErr = e; }
          }
          if (!winner.stream) throw lastErr || new Error('Todos los modelos no disponibles');
        }

        console.log(`[chat] Ganador: ${winner.model}`);

        // ── STREAMING con filtro línea a línea ─────────────────────────────
        let lineBuffer   = '';
        let fullRecipe   = '';
        let cocktailName: string | null = null;
        let imageKw:      string | null = null;
        let nameInjected  = false;

        const processLine = (line: string) => {
          if (isHeaderLine(line)) {
            if (!cocktailName) cocktailName = extractCocktailName(line);
            if (!imageKw)      imageKw      = extractImageLine(line);
            return; // no emitir al cliente
          }
          if (!nameInjected && line.trim()) {
            nameInjected = true;
            if (cocktailName) {
              const alreadyThere = line.toLowerCase().includes(cocktailName.toLowerCase().substring(0,5));
              if (!alreadyThere) {
                const hdr = `### 🍹 ${cocktailName}\n\n`;
                fullRecipe += hdr;
                emit(controller, { type:'token', text:hdr });
              }
            }
          }
          fullRecipe += line + '\n';
          emit(controller, { type:'token', text: line + '\n' });
        };

        for await (const chunk of winner.stream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (!token) continue;
          lineBuffer += token;
          const parts = lineBuffer.split('\n');
          lineBuffer  = parts.pop() ?? '';
          for (const ln of parts) processLine(ln);
        }
        if (lineBuffer) processLine(lineBuffer);

        if (!cocktailName) cocktailName = extractCocktailName(fullRecipe);
        const imagePrompt = buildImagePrompt(imageKw, fullRecipe, cocktailName);

        // ── Guardar en Supabase ─────────────────────────────────────────────
        let cocktailId: string | null = null;
        let jobId:      string | null = null;

        if (cocktailName && shouldSave) {
          const { data: existing } = await supabase
            .from('cocktails_invented').select('id')
            .eq('name', cocktailName).eq('user_id', user.id).maybeSingle();

          if (existing) {
            cocktailId = existing.id;
          } else {
            const { data: newC } = await supabase
              .from('cocktails_invented')
              .insert({ name:cocktailName, recipe:fullRecipe, image_path:null,
                        user_id:user.id, rating:0, tags:generateTags(cocktailName,fullRecipe,moodId) })
              .select().single();
            if (newC) {
              cocktailId = newC.id;
              const { data: newJob } = await supabase
                .from('cocktail_jobs')
                .insert({ user_id:user.id, name:cocktailName, recipe:fullRecipe,
                          image_prompt:imagePrompt, status:'pending', image_path:null, error:null })
                .select().single();
              if (newJob) jobId = newJob.id;
            }
          }
        }

        emit(controller, { type:'done', cocktailId, jobId, cocktailName, imagePrompt });

      } catch (err: any) {
        console.error('[chat/stream]', err.message);
        emit(controller, { type:'error', message: err.message });
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
