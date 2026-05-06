// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { generateTags } from '@/lib/autoTags';

// Cliente de OpenRouter (sin autenticación de usuario)
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'Mi Bartender IA',
  },
});

// ----------------------------------------------------------------------
// Funciones auxiliares de extracción
// ----------------------------------------------------------------------
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
    .split('\n')
    .slice(0, 4)
    .map((l) => l.replace(/^[-*•\s\d.]+/, '').replace(/\d+ml|\d+oz|\d+cl/gi, '').trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Extrae guarniciones y decoraciones mencionadas en la receta.
 * Busca líneas que contengan palabras clave de decoración en español e inglés.
 */
function extractGarnishFromRecipe(text: string): string {
  const lines = text.split('\n');
  const garnishKeywords = [
    'decora', 'garnish', 'guarnición', 'adorna', 'sirve con',
    'rodaja', 'slice', 'twist', 'wedge', 'sprig', 'rama',
    'cereza', 'cherry', 'piña', 'pineapple', 'naranja', 'orange',
    'limón', 'lemon', 'lima', 'lime', 'menta', 'mint', 'salvia', 'sage',
    'canela', 'cinnamon', 'sal', 'salt', 'azúcar', 'sugar rim',
    'coco', 'coconut', 'fruta', 'fruit', 'flor', 'flower', 'hierba', 'herb',
  ];

  const found: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (garnishKeywords.some((kw) => lower.includes(kw))) {
      // Limpiar la línea: quitar markdown, numeración, etc.
      const clean = line
        .replace(/^[-*•\s\d.]+/, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .trim();
      if (clean.length > 3 && clean.length < 80) found.push(clean);
    }
  }

  // Traducir las piezas más comunes al inglés para Pollinations
  const translations: Record<string, string> = {
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
  for (const [es, en] of Object.entries(translations)) {
    if (allText.includes(es) && !garnishEn.includes(en)) {
      garnishEn.push(en);
    }
  }

  return garnishEn.slice(0, 4).join(', ');
}

// ----------------------------------------------------------------------
// Endpoint principal
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // 1. Obtener token del header Authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado: falta token' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    // 2. Verificar el token con Supabase y obtener el usuario autenticado
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usamos service_role para verificar el token
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('[chat] Error de autenticación:', userError);
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    // 3. Crear cliente de Supabase autenticado (para que RLS funcione con auth.uid())
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { prompt, shouldSave = true, locale = 'es', moodId = null } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'Falta la clave de OpenRouter' }, { status: 500 });
    }

    // 4. Llamar a la IA (OpenRouter)
    const isEnglish = locale === 'en';

    const systemPromptEs = `Eres un bartender experto y creativo. Responde siempre en español.

OBLIGATORIO: Tu respuesta debe comenzar SIEMPRE con estas dos líneas, exactamente así:
COCTEL: [nombre del cóctel]
IMAGE: [descripción visual MUY específica del cóctel en inglés, 10-15 palabras]

La línea IMAGE es crítica: describe el COLOR real de la bebida, el TIPO DE VASO exacto,
la GUARNICIÓN visible y el AMBIENTE. Ejemplos de buenas descripciones IMAGE:

COCTEL: Mojito Tropical
IMAGE: bright green mojito in tall highball glass, mint leaves, lime wedge, crushed ice, dark bar background

COCTEL: Negroni Ahumado
IMAGE: deep amber negroni in crystal rocks glass, orange peel twist, smoky atmosphere, candlelight reflection

COCTEL: Blue Lagoon
IMAGE: electric blue cocktail in hurricane glass, maraschino cherry, lemon slice, tropical setting

Reglas para la línea IMAGE:
- Menciona el COLOR REAL de la bebida (amber, deep red, bright green, milky white, etc.)
- Especifica el VASO (highball, martini, rocks, coupe, hurricane, wine glass, etc.)
- Incluye la GUARNICIÓN que se ve (lime wedge, mint sprig, orange twist, salt rim, etc.)
- Añade el AMBIENTE o LUZ (dark bar, tropical setting, candlelight, neon light, etc.)
- Escribe SOLO en inglés, sin comillas

Luego escribe la receta en Markdown.`;

    const systemPromptEn = `You are an expert and creative bartender. Always respond in English.

MANDATORY: Your response must ALWAYS start with these two lines, exactly like this:
COCTEL: [cocktail name]
IMAGE: [VERY specific visual description of the cocktail in English, 10-15 words]

The IMAGE line is critical: describe the REAL COLOR of the drink, the EXACT GLASS TYPE,
the visible GARNISH, and the ATMOSPHERE. Examples of good IMAGE descriptions:

COCTEL: Tropical Mojito
IMAGE: bright green mojito in tall highball glass, mint leaves, lime wedge, crushed ice, dark bar background

COCTEL: Smoky Negroni
IMAGE: deep amber negroni in crystal rocks glass, orange peel twist, smoky atmosphere, candlelight reflection

COCTEL: Blue Lagoon
IMAGE: electric blue cocktail in hurricane glass, maraschino cherry, lemon slice, tropical setting

Rules for the IMAGE line:
- Mention the REAL COLOR of the drink (amber, deep red, bright green, milky white, etc.)
- Specify the GLASS (highball, martini, rocks, coupe, hurricane, wine glass, etc.)
- Include the visible GARNISH (lime wedge, mint sprig, orange twist, salt rim, etc.)
- Add the ATMOSPHERE or LIGHTING (dark bar, tropical setting, candlelight, neon light, etc.)
- Write ONLY in English, no quotes

Then write the recipe in Markdown.`;

    const completion = await openrouter.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        {
          role: 'system',
          content: isEnglish ? systemPromptEn : systemPromptEs,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
    });

    const fullResponse = completion.choices[0]?.message?.content || 'No se generó respuesta.';
    console.log('[chat] Respuesta modelo (primeras 400 chars):\n', fullResponse.substring(0, 400));

    const cocktailName = extractCocktailName(fullResponse);
    const imageKeywords = extractImageLine(fullResponse);

    console.log('[chat] cocktailName:', cocktailName);
    console.log('[chat] imageKeywords:', imageKeywords);

    // Limpiar la respuesta para obtener solo la receta (sin las líneas COCTEL/IMAGE)
    let recipeText = fullResponse
      .replace(/^C[OÓ]CTEL\s*:\s*.+\n?/mi, '')
      .replace(/^IMAGE\s*:\s*.+\n?/mi, '')
      .trim();

    // Si el modelo no incluyó el nombre del cóctel como encabezado en la receta,
    // lo añadimos nosotros para que siempre sea visible en el panel principal.
    if (cocktailName) {
      const nameInRecipe =
        recipeText.toLowerCase().includes(cocktailName.toLowerCase().substring(0, 8));
      if (!nameInRecipe) {
        recipeText = `### 🍹 ${cocktailName}\n\n${recipeText}`;
      }
    }

    // Construir prompt para la imagen
    const photoSuffix = 'professional cocktail photography, studio lighting, bokeh background, photorealistic, 4k, sharp focus';

    // Extraer guarniciones/decoraciones de la receta (siempre, independiente de IMAGE:)
    const garnishFromRecipe = extractGarnishFromRecipe(recipeText);
    console.log('[chat] garnishFromRecipe:', garnishFromRecipe);

    let imagePrompt: string;
    if (imageKeywords) {
      // Fusionar: añadir sólo las guarniciones que el modelo NO mencionó en IMAGE:
      const base = imageKeywords.toLowerCase();
      const missingGarnish = garnishFromRecipe
        .split(', ')
        .filter((g) => g && !base.includes(g.split(' ')[0])) // evitar duplicados aproximados
        .join(', ');
      const combined = missingGarnish ? `${imageKeywords}, ${missingGarnish}` : imageKeywords;
      imagePrompt = `${combined}, ${photoSuffix}`;
    } else {
      const ingredients = extractIngredientsForImage(recipeText);
      const garnishPart = garnishFromRecipe ? `, garnished with ${garnishFromRecipe}` : '';
      imagePrompt = ingredients
        ? `cocktail drink with ${ingredients}${garnishPart}, elegant glass, dark moody bar, ${photoSuffix}`
        : `${cocktailName || 'tropical'} cocktail drink${garnishPart}, elegant glass, dark moody bar, ${photoSuffix}`;
    }
    console.log('[chat] imagePrompt final:', imagePrompt);

    let cocktailId: string | null = null;
    let jobId: string | null = null;

    // 5. Guardar en Supabase (solo si el usuario quiere guardar y tenemos nombre)
    if (cocktailName && shouldSave) {
      console.log('[chat] Intentando guardar cóctel:', cocktailName, 'user_id:', user.id);

      // Verificar si ya existe un cóctel con el mismo nombre para este usuario
      const { data: existing, error: existingError } = await supabase
        .from('cocktails_invented')
        .select('id')
        .eq('name', cocktailName)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingError) {
        console.error('[chat] Error al buscar existencia:', existingError);
      }

      if (existing) {
        cocktailId = existing.id;
        console.log('[chat] El cóctel ya existe, id:', cocktailId);
      } else {
        // Insertar nuevo cóctel
        const { data: newCocktail, error: insertError } = await supabase
          .from('cocktails_invented')
          .insert({
            name: cocktailName,
            recipe: recipeText,
            image_path: null,
            user_id: user.id,
            rating: 0,
            tags: generateTags(cocktailName, recipeText, moodId),
          })
          .select()
          .single();

        if (insertError) {
          console.error('[chat] Error al insertar cóctel:', insertError);
        } else {
          cocktailId = newCocktail.id;
          console.log('[chat] Cóctel insertado, id:', cocktailId);

          // Crear un job para la generación de imagen (opcional)
          const { data: newJob, error: jobError } = await supabase
            .from('cocktail_jobs')
            .insert({
              user_id: user.id,
              name: cocktailName,
              recipe: recipeText,
              image_prompt: imagePrompt,
              status: 'pending',
              image_path: null,
              error: null,
            })
            .select()
            .single();

          if (jobError) {
            console.error('[chat] Error al crear job:', jobError);
          } else {
            jobId = newJob.id;
            console.log('[chat] Job creado, id:', jobId);
          }
        }
      }
    } else {
      console.log('[chat] No se guardó (shouldSave=', shouldSave, ', cocktailName=', cocktailName, ')');
    }

    // 6. Responder al frontend
    return NextResponse.json({
      response: recipeText,
      cocktailId,
      jobId,
      cocktailName,
      imagePrompt,
    });
  } catch (error: any) {
    console.error('[chat] Error general:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}