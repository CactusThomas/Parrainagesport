import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { UserProfile, Role } from '../types';

type Ctx = {
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<Ctx>({
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

const normalizeRole = (r?: string | null): Role => {
  const l = (r || '').toLowerCase();
  if (l.startsWith('adh')) return 'adherent';
  if (l.startsWith('coa')) return 'coach';
  if (l.startsWith('adm')) return 'admin';
  return 'adherent';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const ensureProfileRow = async (uid: string, email: string | null) => {
    console.log('[AuthContext] ensureProfileRow start', { uid, email });
    // Si aucune row users, on crée un profil minimal
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    console.log('[AuthContext] check existing profile', { data, error });
    if (error) throw error;
    if (!data) {
      console.log('[AuthContext] Creating new profile...');
      const { error: insErr } = await supabase
        .from('users')
        .insert({
          id: uid,
          nom: email?.split('@')[0] || 'Utilisateur',
          email,
          type_utilisateur: 'adherent',
        });
      console.log('[AuthContext] Insert result', { insErr });
      if (insErr) throw insErr;
    }
  };

  const loadProfile = async () => {
    console.log('[AuthContext] loadProfile start');
    const au = await supabase.auth.getUser();
    const u = au.data.user;
    console.log('[AuthContext] getUser result', { user: u });
    if (!u) { setProfile(null); return; }

    try {
      await ensureProfileRow(u.id, u.email ?? null);
    } catch (err) {
      console.error('[AuthContext] ensureProfileRow failed', err);
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', u.id)
      .maybeSingle();

    console.log('[AuthContext] load profile result', { data, error });
    if (error) { console.error(error); setProfile(null); return; }
    if (data) {
      data.type_utilisateur = normalizeRole(data.type_utilisateur);
      setProfile(data as UserProfile);
      console.log('[AuthContext] Profile loaded successfully');
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    loadProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadProfile());
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); setProfile(null); };
  const refreshProfile = async () => { await loadProfile(); };

  return (
    <AuthContext.Provider value={{ profile, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // 👉 création du profil s’il n’existe pas
  const { user } = data;
  if (user) {
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      nom: user.email?.split('@')[0],
      type_utilisateur: 'adherent'
    });
  }

  await refreshProfile();
};

