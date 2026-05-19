// app/api/substitute/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Mismos modelos que el chat route — confirmados funcionando
const MODEL_CHAIN = [
  'tencent/hy3-preview:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'openai/gpt-oss-120b:free',
  'openrouter/owl-alpha',
  'openrouter/free',
];

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'No configurado' }, { status: 500 });
  }

  const { ingredients, ingredient, cocktailName, locale = 'es' } = await req.json() as {
    ingredients?: string[];
    ingredient?: string;
    cocktailName: string;
    locale: string;
  };

  const items: string[] = ingredients?.length
    ? ingredients
    : ingredient ? [ingredient] : [];

  if (items.length === 0) {
    return NextResponse.json({ error: 'Ingrediente requerido' }, { status: 400 });
  }

  const isEs       = locale !== 'en';
  const ingredientList = items.map(i => `"${i}"`).join(', ');

  const systemPrompt = isEs
    ? `Eres un bartender práctico. Responde SOLO EN ESPAÑOL. Prohibido el inglés.`
    : `You are a practical bartender. Respond ONLY IN ENGLISH. Spanish is forbidden.`;

  const userPrompt = isEs
    ? `Cóctel: "${cocktailName}". Me faltan: ${ingredientList}.
Dame sustitutos prácticos que pueda tener en casa. Formato:
• Sin [ingrediente]: [opción 1] o [opción 2]
Solo la lista. Sin introducción. En español.`
    : `Cocktail: "${cocktailName}". I'm missing: ${ingredientList}.
Give me practical substitutes I can have at home. Format:
• No [ingredient]: [option 1] or [option 2]
List only. No intro. In English.`;

  const openrouter = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      'HTTP-Referer': 'https://mi-bartender-ia.vercel.app',
      'X-Title': 'Mi Bartender IA',
    },
  });

  let lastError: any = null;

  // Intentar con cada modelo de la cadena
  for (const model of MODEL_CHAIN) {
    try {
      const completion = await openrouter.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        temperature: 0.4,
        max_tokens: 200,
      });

      const answer = completion.choices[0]?.message?.content?.trim() || '';
      if (answer.length < 5) continue; // respuesta vacía → probar siguiente

      console.log(`[substitute] ✅ modelo: ${model}`);
      return NextResponse.json({ answer, ingredients: items });

    } catch (err: any) {
      lastError = err;
      const status = err.status || err.response?.status;
      console.warn(`[substitute] ⚠️ ${model} → ${status}: ${err.message}`);

      // Solo reintentar con siguiente modelo si es rate limit (429), 
      // service unavailable (503), bad gateway (502) o not found (404)
      const skip = status === 429 || status === 503 || status === 502 || status === 404 ||
                   /429|404|rate.?limit|no endpoint|provider returned/i.test(err.message || '');
      
      if (skip) continue;

      // Cualquier otro error → salir del loop
      break;
    }
  }

  // Todos los modelos fallaron
  const status = lastError?.status || lastError?.response?.status || 500;
  const isRateLimit = status === 429 || status === 503;

  return NextResponse.json(
    {
      error: isRateLimit
        ? isEs
          ? 'El servicio está ocupado ahora mismo. Intenta en unos segundos.'
          : 'Service is busy right now. Try again in a few seconds.'
        : lastError?.message || 'Error',
    },
    { status: isRateLimit ? 429 : 500 }
  );
}
