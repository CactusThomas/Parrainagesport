import { supabase } from './supabase';

export async function uploadAvatar(file: File) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${user.id}/avatar.${ext}?t=${Date.now()}`; // anti-cache

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path.replace(/\?.*$/, ''), file, { upsert: true });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path.replace(/\?.*$/, ''));
  return pub.publicUrl + `?t=${Date.now()}`;
}

export async function deleteAvatar() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  // 1) lister les fichiers du dossier utilisateur et supprimer
  const { data: list, error: listErr } = await supabase.storage
    .from('avatars')
    .list(user.id, { limit: 50 });
  if (listErr) throw listErr;

  if (list && list.length) {
    const files = list.map((f) => `${user.id}/${f.name}`);
    const { error: delErr } = await supabase.storage.from('avatars').remove(files);
    if (delErr) throw delErr;
  }

  // 2) mettre à jour le profil
  const { error: upErr } = await supabase
    .from('users')
    .update({ photo_url: null })
    .eq('id', user.id);
  if (upErr) throw upErr;
}
