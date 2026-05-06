import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getUserFromToken } from '@/lib/auth-helpers';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ── Verificar autenticación ─────────────────────────────────────────
    const { user, error: authError } = await getUserFromToken(
      req.headers.get('Authorization')
    );
    if (!user) {
      return NextResponse.json({ error: authError || 'Debes iniciar sesión' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    // Verificar que el cóctel pertenece a este usuario
    const { data: cocktail, error: fetchError } = await supabase
      .from('cocktails_invented')
      .select('id, job_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !cocktail) {
      return NextResponse.json({ error: 'Cóctel no encontrado o no tienes permiso' }, { status: 404 });
    }

    // Si tiene job_id, eliminar el job asociado
    if (cocktail.job_id) {
      const { error: jobError } = await supabase
        .from('cocktail_jobs')
        .delete()
        .eq('id', cocktail.job_id)
        .eq('user_id', user.id);

      if (jobError) {
        console.error('Error al eliminar job:', jobError);
      }
    }

    // Eliminar el cóctel
    const { error: deleteError } = await supabase
      .from('cocktails_invented')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error al eliminar cóctel:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Cóctel eliminado' });

  } catch (error: any) {
    console.error('Error en DELETE /api/cocktails/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
      console.error('Error al eliminar cóctel:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Cóctel eliminado' });

  } catch (error: any) {
    console.error('Error en DELETE /api/cocktails/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}