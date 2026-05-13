// app/api/daily-cocktail/route.ts
// Genera el cóctel del día basado en la fecha actual.
// La misma fecha siempre produce el mismo cóctel (determinista por seed).
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Cócteles semilla por día del mes (1-31). 
// Se usan como inspiración para el prompt — el modelo crea su propia versión.
const DAILY_SEEDS = [
  'Mojito Cubano', 'Margarita Clásica', 'Piña Colada', 'Negroni', 'Old Fashioned',
  'Cosmopolitan', 'Aperol Spritz', 'Daiquiri de Fresa', 'Moscow Mule', 'Manhattan',
  'Sex on the Beach', 'Tequila Sunrise', 'Gin Tonic Signature', 'Caipirinha', 'Martini Dry',
  'Mojito de Maracuyá', 'Blue Lagoon', 'Paloma', 'Sangría Española', 'Espresso Martini',
  'Clover Club', 'Lemon Drop', 'Jungle Bird', 'Paper Plane', 'Last Word',
  'Frozen Margarita', 'Rum Punch Tropical', 'Amaretto Sour', 'Dark and Stormy', 'Porn Star Martini',
  'Cóctel del Año',
];

export async function GET(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'No configurado' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const locale   = searchParams.get('locale') || 'es';
  const dateKey  = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const fullMode = searchParams.get('full') === 'true'; // solicitar receta completa

  const isEnglish = locale === 'en';
  const day = parseInt(dateKey.split('-')[2] || '1', 10) - 1;
  const seedCocktail = DAILY_SEEDS[day % DAILY_SEEDS.length];

  // Modo receta completa: devolver preparación detallada
  if (fullMode) {
    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: { 'HTTP-Referer': 'https://mi-bartender-ia.vercel.app', 'X-Title': 'Mi Bartender IA' },
    });
    try {
      const completion = await openrouter.chat.completions.create({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: isEnglish ? 'You are a cocktail expert. Respond in English.' : 'Eres un experto en coctelería. Responde en español.' },
          { role: 'user', content: isEnglish
            ? `Give me the full recipe for "${seedCocktail}" in Markdown format. Include: title, ingredients with exact measures, step-by-step preparation, and serving tip.`
            : `Dame la receta completa de "${seedCocktail}" en formato Markdown. Incluye: título, ingredientes con medidas exactas, preparación paso a paso y consejo de servicio.`
          },
        ],
        temperature: 0.7,
        max_tokens: 700,
      });
      const fullRecipe = completion.choices[0]?.message?.content || '';
      return NextResponse.json({ fullRecipe });
    } catch {
      return NextResponse.json({ fullRecipe: '' });
    }
  }

  const openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://mi-bartender-ia.vercel.app',
      'X-Title': 'Mi Bartender IA — Daily',
    },
    timeout: 30000,
  });

  const prompt = isEnglish
    ? `Create a short and inspiring version of the "${seedCocktail}" cocktail for today. 
Respond ONLY in this exact JSON format, nothing else:
{
  "name": "cocktail name",
  "tagline": "one evocative sentence (max 12 words)",
  "ingredients": ["ingredient 1 with measure", "ingredient 2", "ingredient 3", "ingredient 4"],
  "tip": "one bartender tip (max 15 words)",
  "imagePrompt": "visual description 10-12 words — color, glass, garnish, mood"
}`
    : `Crea una versión corta e inspiradora del cóctel "${seedCocktail}" para hoy.
Responde ÚNICAMENTE en este formato JSON exacto, nada más:
{
  "name": "nombre del cóctel",
  "tagline": "una frase evocadora (máx 12 palabras)",
  "ingredients": ["ingrediente 1 con medida", "ingrediente 2", "ingrediente 3", "ingrediente 4"],
  "tip": "un consejo del bartender (máx 15 palabras)",
  "imagePrompt": "descripción visual 10-12 palabras — color, vaso, guarnición, ambiente"
}`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: isEnglish ? 'You are a cocktail expert. Respond ONLY with valid JSON.' : 'Eres un experto en coctelería. Responde ÚNICAMENTE con JSON válido.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // Extraer JSON de la respuesta (puede venir con markdown code fences)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const data = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      ...data,
      dateKey,
      seedCocktail,
    });
  } catch (err: any) {
    console.error('[daily-cocktail]', err.message);
    // Fallback: devolver datos estáticos si la IA falla
    return NextResponse.json({
      name: seedCocktail,
      tagline: isEnglish ? 'The classic of the day' : 'El clásico del día',
      ingredients: isEnglish
        ? ['50ml base spirit', '25ml citrus juice', '15ml simple syrup', 'Ice & garnish']
        : ['50ml espirituoso base', '25ml jugo cítrico', '15ml almíbar', 'Hielo y guarnición'],
      tip: isEnglish ? 'Always use fresh ingredients for the best result.' : 'Usa siempre ingredientes frescos para el mejor resultado.',
      imagePrompt: `${seedCocktail} cocktail, elegant glass, professional photography, studio lighting`,
      dateKey,
      seedCocktail,
    });
  }
}
