import { supabase } from './supabaseClient';

/**
 * Obtiene el usuario autenticado a partir del token JWT del header Authorization.
 * Retorna null si no hay token o el token es inválido/expirado.
 */
export async function getUserFromToken(authHeader: string | null): Promise<{
  user: { id: string; email?: string } | null;
  error: string | null;
}> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Token de autenticación requerido' };
  }

  const token = authHeader.replace('Bearer ', '').trim();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return { user: null, error: error?.message || 'Usuario no autenticado' };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    error: null,
  };
}