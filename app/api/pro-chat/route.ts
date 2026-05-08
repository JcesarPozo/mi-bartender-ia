// app/api/pro-chat/route.ts
// Bartender Pro — conversación multi-turno con memoria de contexto
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { generateTags } from '@/lib/autoTags';

export interface ProMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'Servidor no configurado' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    // Verificar usuario
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que el usuario tiene plan Premium
    const { data: subData } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const isPremium = subData?.plan === 'premium' && subData?.status === 'active';
    if (!isPremium) {
      return NextResponse.json({ error: 'UPGRADE_REQUIRED' }, { status: 403 });
    }

    const { messages, locale = 'es', saveRequest } = await req.json() as {
      messages: ProMessage[];
      locale: string;
      saveRequest?: { cocktailName: string; recipe: string };
    };

    // ─── Guardar receta desde Pro si se pide ──────────────────────────────
    if (saveRequest) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: existing } = await supabase
        .from('cocktails_invented')
        .select('id').eq('name', saveRequest.cocktailName).eq('user_id', user.id).maybeSingle();

      if (!existing) {
        const { data: saved } = await supabase.from('cocktails_invented').insert({
          name: saveRequest.cocktailName,
          recipe: saveRequest.recipe,
          image_path: null,
          user_id: user.id,
          rating: 0,
          tags: generateTags(saveRequest.cocktailName, saveRequest.recipe, null),
        }).select().single();
        return NextResponse.json({ saved: true, cocktailId: saved?.id });
      }
      return NextResponse.json({ saved: true, cocktailId: existing.id });
    }

    // ─── Conversación Pro ─────────────────────────────────────────────────
    const isEnglish = locale === 'en';

    const systemPrompt = isEnglish
      ? `You are an expert and creative personal bartender having a live conversation with your client.
You remember everything discussed in the conversation and can refine cocktails based on feedback.

CONVERSATION RULES:
- Be warm, professional, and personable — like a real bartender behind the bar
- When creating or refining a cocktail, always include the complete recipe
- Mark cocktail names clearly with: **🍹 Cocktail Name**
- If the user asks to modify something ("make it less sweet", "try with gin instead"), adjust the previous recipe
- If satisfied, the client can save it to their catalog
- Keep responses concise but complete — no walls of text
- You can also answer cocktail questions, suggest pairings, explain techniques

When providing a recipe, always include:
1. Ingredients with exact measurements
2. Step-by-step preparation
3. Serving suggestion and garnish`
      : `Eres un bartender personal experto y creativo que tiene una conversación en vivo con tu cliente.
Recuerdas todo lo conversado y puedes refinar cócteles según el feedback recibido.

REGLAS DE CONVERSACIÓN:
- Sé cálido, profesional y cercano — como un bartender real detrás de la barra
- Cuando crees o refines un cóctel, incluye siempre la receta completa
- Marca los nombres del cóctel claramente con: **🍹 Nombre del Cóctel**
- Si el usuario pide modificaciones ("hazlo menos dulce", "prueba con gin"), ajusta la receta anterior
- Cuando el cliente esté satisfecho, puede guardarlo en su catálogo
- Respuestas concisas pero completas — sin paredes de texto
- También puedes responder preguntas sobre coctelería, sugerir maridajes, explicar técnicas

Cuando proporciones una receta, incluye siempre:
1. Ingredientes con medidas exactas
2. Preparación paso a paso
3. Sugerencia de servicio y guarnición`;

    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://mi-bartender-ia.vercel.app',
        'X-Title': 'Mi Bartender IA — Pro',
      },
    });

    const completion = await openrouter.chat.completions.create({
      model: 'openrouter/free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.85,
      max_tokens: 1200,
    });

    const reply = completion.choices[0]?.message?.content || '';

    // Extraer nombre del cóctel si hay receta en la respuesta
    const nameMatch = reply.match(/\*\*🍹\s*([^*\n]+)\*\*/);
    const cocktailName = nameMatch ? nameMatch[1].trim() : null;

    return NextResponse.json({ reply, cocktailName });
  } catch (err: any) {
    console.error('[pro-chat]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
