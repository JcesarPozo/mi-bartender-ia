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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
    }

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

    // Guardar coctel si se solicita
    if (saveRequest) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const { data: existing } = await supabase
        .from('cocktails_invented')
        .select('id')
        .eq('name', saveRequest.cocktailName)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        const { data: saved } = await supabase
          .from('cocktails_invented')
          .insert({
            name: saveRequest.cocktailName,
            recipe: saveRequest.recipe,
            image_path: null,
            user_id: user.id,
            rating: 0,
            tags: generateTags(saveRequest.cocktailName, saveRequest.recipe, null),
          })
          .select()
          .single();
        return NextResponse.json({ saved: true, cocktailId: saved?.id });
      }
      return NextResponse.json({ saved: true, cocktailId: existing.id });
    }

    // Conversacion Pro
    const isEnglish = locale === 'en';

    const systemPrompt = isEnglish
      ? `You are an expert personal bartender in a live conversation. Respond ALWAYS IN ENGLISH.
Mark cocktail names with **Cocktail Name**. Include full recipes when creating cocktails.`
      : `Eres un bartender personal experto en conversacion en vivo. Responde SIEMPRE EN ESPANOL.
Marca los nombres con **Nombre del Coctel**. Incluye recetas completas al crear cocteles.`;

    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://mi-bartender-ia.vercel.app',
        'X-Title': 'Mi Bartender IA Pro',
      },
    });

    const completion = await openrouter.chat.completions.create({
      model: 'tencent/hy3-preview:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.85,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || '';
    const nameMatch = reply.match(/\*\*([^*\n]{3,50})\*\*/);
    const cocktailName = nameMatch ? nameMatch[1].trim() : null;

    return NextResponse.json({ reply, cocktailName });
  } catch (err: any) {
    console.error('[pro-chat]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
