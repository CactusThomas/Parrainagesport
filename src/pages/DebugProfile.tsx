// src/pages/DebugProfile.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ensureProfile } from '../lib/ensureProfile';

const DebugProfile: React.FC = () => {
  const [out, setOut] = useState<string>('');

  async function handleEnsure() {
    try {
      setOut('Création/Sync du profil…');
      const row = await ensureProfile({ ville: 'Lyon', type_utilisateur: 'adherent' });
      setOut('✅ Profil OK:\n' + JSON.stringify(row, null, 2));
    } catch (e: any) {
      setOut('❌ ' + (e?.message || String(e)));
      console.error(e);
    }
  }

  async function handleShow() {
    try {
      setOut('Lecture du profil…');
      const { data: au } = await supabase.auth.getUser();
      if (!au?.user) return setOut('Pas connecté');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', au.user.id)
        .maybeSingle();

      if (error) throw error;
      setOut('📄 Profil:\n' + JSON.stringify(data, null, 2));
    } catch (e: any) {
      setOut('❌ ' + (e?.message || String(e)));
      console.error(e);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Debug Profile</h1>
      <p>Utilisez ces boutons pour forcer la création/lecture de votre ligne dans <code>public.users</code>.</p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <button onClick={handleEnsure}>Créer / Sync profil</button>
        <button onClick={handleShow}>Voir mon profil</button>
      </div>
      <pre style={{ background: '#111', color: '#0f0', padding: 12, borderRadius: 8, minHeight: 160 }}>
        {out}
      </pre>
    </div>
  );
};

export default DebugProfile;
