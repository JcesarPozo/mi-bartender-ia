// app/api/pollinations-proxy/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // Limpieza del prompt
    let cleanPrompt = prompt
      .replace(/\*\*/g, '')        // eliminar **
      .replace(/\*/g, '')          // eliminar *
      .trim()
      .replace(/\s+/g, '_')        // espacios a guiones bajos
      .replace(/[^a-zA-Z0-9_]/g, ''); // eliminar caracteres raros

    // Si el prompt queda vacío, usar un valor por defecto
    if (!cleanPrompt || cleanPrompt.length === 0) {
      cleanPrompt = 'cocktail';
    }

    // Acortar si es demasiado largo (Pollinations tiene límite)
    if (cleanPrompt.length > 200) {
      cleanPrompt = cleanPrompt.substring(0, 200);
    }

    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=512&height=512&nologo=true`;

    console.log('[Proxy] URL generada:', imageUrl);
    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('[Proxy] Error:', error.message);
    // En caso de error, devolver la URL de imagen por defecto
    return NextResponse.json({ imageUrl: '/default-cocktail.jpg' });
  }
}