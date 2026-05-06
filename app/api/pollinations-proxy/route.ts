import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Aumentar timeout de Next.js para esta ruta específica
export const maxDuration = 90;

export async function POST(req: Request) {
  let imageBuffer: ArrayBuffer | null = null;
  let contentType: string | null = null;

  try {
    // --- 1. Leer datos de la petición ---
    const body = await req.json().catch(() => ({}));
    const { prompt, cocktailId } = body;
    const authHeader = req.headers.get('authorization');

    if (!prompt) {
      return NextResponse.json({ error: 'Falta el prompt' }, { status: 400 });
    }

    // --- 2. Generar imagen desde Pollinations (misma lógica que tenías) ---
    const cleanPrompt = prompt
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();

    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 99999);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&model=turbo&seed=${seed}`;

    console.log('[proxy] URL Pollinations:', pollinationsUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 80000);

    let response;
    try {
      response = await fetch(pollinationsUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      clearTimeout(timeout);
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      console.error('[proxy] Error descargando imagen:', fetchErr.message);
      throw fetchErr;
    }

    if (!response.ok) {
      throw new Error(`Pollinations respondió ${response.status}`);
    }

    contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Respuesta no es imagen: ${contentType}`);
    }

    imageBuffer = await response.arrayBuffer();
    console.log(`[proxy] Imagen recibida OK: ${imageBuffer.byteLength} bytes`);

    // --- 3. (NUEVO) Guardar en Supabase Storage y actualizar la base de datos ---
    if (authHeader && authHeader.startsWith('Bearer ') && cocktailId) {
      const token = authHeader.replace('Bearer ', '');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );

      // Verificar usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user) {
        // Subir a Storage
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 10)}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('cocktail-images')
          .upload(fileName, imageBuffer, { contentType: 'image/webp' });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('cocktail-images').getPublicUrl(fileName);
          const permanentUrl = publicUrlData.publicUrl;

          // Actualizar la columna image_path en la tabla cocktails_invented
          const { error: updateError } = await supabase
            .from('cocktails_invented')
            .update({ image_path: permanentUrl })
            .eq('id', cocktailId);

          if (updateError) {
            console.error('[proxy] Error actualizando image_path:', updateError);
          } else {
            console.log('[proxy] Imagen guardada permanentemente en:', permanentUrl);
          }
        } else {
          console.error('[proxy] Error subiendo a Storage:', uploadError);
        }
      } else {
        console.warn('[proxy] No se pudo autenticar al usuario para guardar imagen');
      }
    } else {
      if (!authHeader) console.warn('[proxy] Falta header Authorization');
      if (!cocktailId) console.warn('[proxy] No se recibió cocktailId, no se guardará la imagen');
    }

    // --- 4. Devolver la imagen tal cual (mismo comportamiento que antes) ---
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType!,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error: any) {
    console.error('[proxy] Error final:', error.message);
    // Si ya habíamos obtenido la imagen pero falló la subida, aún podríamos devolverla?
    // Por simplicidad, devolvemos JSON de error y page.tsx usará fallback.
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}