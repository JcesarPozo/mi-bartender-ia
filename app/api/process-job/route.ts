import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getUserFromToken } from '@/lib/auth-helpers';

export async function POST(req: Request) {
  let jobId: string | null = null;

  try {
    // ── Verificar autenticación ─────────────────────────────────────────
    const { user, error: authError } = await getUserFromToken(
      req.headers.get('Authorization')
    );
    if (!user) {
      return NextResponse.json({ error: authError || 'Debes iniciar sesión' }, { status: 401 });
    }

    const body = await req.json();
    jobId = body.jobId;

    if (!jobId) {
      return NextResponse.json({ error: 'Falta jobId' }, { status: 400 });
    }

    // 1. Obtener el job — verificar que pertenece al usuario
    const { data: job, error: jobError } = await supabase
      .from('cocktail_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job no encontrado o no tienes permiso' }, { status: 404 });
    }

    // 2. Si ya está completado, devolver la imagen existente
    if (job.status === 'completed' && job.image_path) {
      return NextResponse.json({ imageUrl: job.image_path });
    }

    // 3. Generar la imagen con Pollinations.ai
    const imagePrompt = job.image_prompt || `Coctel ${job.name}`;
    const seed = Math.floor(Math.random() * 99999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=512&height=512&nologo=true&seed=${seed}`;

    // 4. Actualizar el job
    const { error: updateJobError } = await supabase
      .from('cocktail_jobs')
      .update({
        status: 'completed',
        image_path: imageUrl,
        error: null,
      })
      .eq('id', jobId)
      .eq('user_id', user.id);

    if (updateJobError) throw updateJobError;

    // 5. Actualizar el cóctel — por nombre y user_id
    const { error: updateCocktailError } = await supabase
      .from('cocktails_invented')
      .update({ image_path: imageUrl })
      .eq('name', job.name)
      .eq('user_id', user.id);

    if (updateCocktailError) throw updateCocktailError;

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Error generando imagen:', error);

    if (jobId) {
      try {
        await supabase
          .from('cocktail_jobs')
          .update({ status: 'failed', error: error.message })
          .eq('id', jobId);
      } catch (innerErr) {
        console.error('No se pudo actualizar estado del job:', innerErr);
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}