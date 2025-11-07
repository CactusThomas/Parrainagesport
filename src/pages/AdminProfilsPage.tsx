// src/pages/AdminProfilsPage.tsx
import React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Shield, CheckCircle2, XCircle, PauseCircle, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

type U = {
  id: string;
  nom: string | null;
  email: string | null;
  type_utilisateur: 'adherent' | 'coach' | 'admin';
  status: 'active' | 'pending' | 'suspended';
  est_booste: boolean | null;
  ville: string | null;
  photo_url: string | null;
  created_at?: string | null;
  moderation_note?: string | null;
};

const TABS: Array<{ key: U['status'] | 'all'; label: string; icon: React.ComponentType<any> }> = [
  { key: 'all', label: 'Tous', icon: Shield },
  { key: 'active', label: 'Actifs', icon: CheckCircle2 },
  { key: 'pending', label: 'En attente', icon: PauseCircle },
  { key: 'suspended', label: 'Suspendus', icon: XCircle },
];

const AdminProfilsPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.type_utilisateur === 'admin';

  const [tab, setTab] = React.useState<U['status'] | 'all'>('all');
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<U[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    let query = supabase.from('users').select('id,nom,email,type_utilisateur,status,est_booste,ville,photo_url,created_at,moderation_note').order('created_at', { ascending: false });
    if (tab !== 'all') query = query.eq('status', tab);
    if (q.trim()) {
      const like = `%${q.trim()}%`;
      query = query.or(`nom.ilike.${like},email.ilike.${like},ville.ilike.${like}`);
    }
    const { data, error } = await query.limit(1000);
    if (error) { console.error(error); setRows([]); } else { setRows((data as U[]) ?? []); }
    setLoading(false);
  }, [tab, q]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    const ch = supabase
      .channel('admin:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const moderate = async (id: string, status: U['status']) => {
    const note = status === 'suspended' ? (prompt('Motif de la suspension (optionnel):') ?? '') : null;
    const { error } = await supabase.rpc('admin_set_user_status', {
      p_user_id: id,
      p_status: status,
      p_note: note
    });
    if (error) { alert(error.message); console.error(error); }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 flex gap-2">
          <AlertTriangle className="w-5 h-5" />
          Accès réservé aux administrateurs.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Modération des profils</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, email, ville)…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={load} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Recharger</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1.4fr_0.9fr_0.9fr_0.9fr_1.2fr] gap-3 px-4 py-2 border-b bg-gray-50 text-sm font-medium">
          <div>Nom / Email</div><div>Ville</div><div>Type</div><div>Boost</div><div>Statut</div><div>Actions</div>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-gray-500">Aucun profil.</div>
        ) : (
          rows.map((u) => (
            <div key={u.id} className="grid grid-cols-[1.4fr_1.4fr_0.9fr_0.9fr_0.9fr_1.2fr] gap-3 px-4 py-3 border-t text-sm">
              <div className="flex items-center gap-3">
                {u.photo_url ? (
                  <img src={u.photo_url} alt={u.nom ?? ''} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{u.nom ?? '—'}</div>
                  <div className="text-gray-500 text-xs truncate">{u.email ?? '—'}</div>
                </div>
              </div>
              <div className="text-gray-700">{u.ville ?? '—'}</div>
              <div className="capitalize">{u.type_utilisateur}</div>
              <div>
                {u.est_booste ? (
                  <span className="inline-flex items-center gap-1 text-[#27ADF5] bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" /> Actif
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">—</span>
                )}
              </div>
              <div>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${
                  u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  u.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {u.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {u.status !== 'active' && (
                  <button onClick={() => moderate(u.id, 'active')} className="px-2 py-1 rounded bg-emerald-600 text-white hover:opacity-90">Activer</button>
                )}
                {u.status !== 'pending' && (
                  <button onClick={() => moderate(u.id, 'pending')} className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 border">Mettre en attente</button>
                )}
                {u.status !== 'suspended' && (
                  <button onClick={() => moderate(u.id, 'suspended')} className="px-2 py-1 rounded bg-rose-600 text-white hover:opacity-90">Suspendre</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminProfilsPage; 
