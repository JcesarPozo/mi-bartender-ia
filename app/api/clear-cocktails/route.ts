import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE() {
  try {
    // Usamos una condición que siempre es verdadera (ningún UUID es igual a la cadena)
    const { error: errorJobs } = await supabase
      .from('cocktail_jobs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (errorJobs) throw errorJobs;

    const { error: errorCocktails } = await supabase
      .from('cocktails_invented')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (errorCocktails) throw errorCocktails;

    return NextResponse.json({ success: true, message: 'Tablas limpiadas correctamente' });
  } catch (error: any) {
    console.error('Error al limpiar tablas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}