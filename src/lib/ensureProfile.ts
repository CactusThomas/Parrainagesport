import { supabase } from './supabase';

export async function ensureProfile() {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error('Not logged');

  // upsert sur l'id auth (évite l’erreur si déjà créé)
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: user.id,                    // <- indispensable
      email: user.email ?? null,
      nom: user.email?.split('@')[0] ?? 'Utilisateur',
      type_utilisateur: 'adherent',
      ville: null
    }, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}
