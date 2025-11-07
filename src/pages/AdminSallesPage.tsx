// src/pages/AdminSallesPage.tsx
import React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, XCircle, Clock, Search, Shield, Loader2, AlertTriangle } from 'lucide-react';

type Salle = {
  id: string;
  nom: string;
  chaine: string | null;
  adresse: string | null;
  ville: string | null;
  latitude: number | null;
  longitude: number | null;
  status: 'pending' | 'approved' | 'rejected';
  created_by: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  moderation_note: string | null;
  created_at?: string;
};

const TABS: Array<{ key: Salle['status'] | 'all'; label: string; icon: React.ComponentType<any> }> = [
  { key: 'pending', label: 'En attente', icon: Clock },
  { key: 'approved', label: 'Approuvées', icon: CheckCircle2 },
  { key: 'rejected', label: 'Refusées', icon: XCircle },
  { key: 'all', label: 'Toutes', icon: Shield },
];

const AdminSallesPage: React.FC = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.type_utilisateur === 'admin';

  const [tab, setTab] = React.useState<Salle['status'] | 'all'>('pending');
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Salle[]>([]);
  const [counts, setCounts] = React.useState({ pending: 0, approved: 0, rejected: 0 });

  const load = React.useCallback(async () => {
    setLoading(true);

    const agg = async (status: Salle['status']) => {
      const { count } = await supabase.from('salles').select('id', { head: true, count: 'exact' }).eq('status', status);
      return count ?? 0;
    };
    const [p, a, r] = await Promise.all([agg('pending'), agg('approved'), agg('rejected')]);
    setCounts({ pending: p, approved: a, rejected: r });

    let query = supabase.from('salles').select('*').order('created_at', { ascending: false });
    if (tab !== 'all') query = query.eq('status', tab);
    if (q.trim()) {
      const like = `%${q.trim()}%`;
      query = query.or(`nom.ilike.${like},chaine.ilike.${like},adresse.ilike.${like}`);
    }

    const { data, error } = await query.limit(1000);
    if (error) {
      console.error('load salles error', error);
      setRows([]);
    } else {
      setRows((data as Salle[]) ?? []);
    }
    setLoading(false);
  }, [tab, q]);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    const ch = supabase.channel('admin:salles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salles' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const moderate = async (id: string, status: Salle['status'], note?: string) => {
    const { error } = await supabase.rpc('admin_set_salle_status', {
      p_salle_id: id, p_status: status, p_note: note || null
    });
    if (error) { alert(error.message); console.error(error); }
  };

  const onApprove = async (id: string) => { if (confirm('Approuver cette salle ?')) await moderate(id, 'approved'); };
  const onReject  = async (id: string) => { const n = prompt('Motif du refus (optionnel) :') ?? ''; await moderate(id, 'rejected', n); };
  const onPending = async (id: string) => { await moderate(id, 'pending'); };

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Modération des salles</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          const badge = key === 'pending' ? counts.pending : key === 'approved' ? counts.approved : key === 'rejected' ? counts.rejected : (counts.pending + counts.approved + counts.rejected);
          return (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-xs rounded-full ${isActive ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-700'}`}>
                {badge}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, chaîne, adresse)…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button onClick={load} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">Recharger</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_1.6fr_0.9fr_0.9fr] gap-3 px-4 py-2 border-b bg-gray-50 text-sm font-medium">
          <div>Nom</div><div>Chaîne</div><div>Adresse</div><div>Statut</div><div>Actions</div>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-gray-500">Aucune salle.</div>
        ) : (
          rows.map((s) => (
            <div key={s.id} className="grid grid-cols-[1.2fr_1fr_1.6fr_0.9fr_0.9fr] gap-3 px-4 py-3 border-t text-sm">
              <div className="font-medium">{s.nom}</div>
              <div className="text-gray-600">{s.chaine ?? '—'}</div>
              <div className="text-gray-600 truncate">{s.adresse ?? '—'}</div>
              <div>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${
                  s.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  s.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>{s.status}</span>
              </div>
              <div className="flex items-center gap-2">
                {s.status !== 'approved' && (
                  <button onClick={() => onApprove(s.id)} className="px-2 py-1 rounded bg-emerald-600 text-white hover:opacity-90" title="Approuver">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {s.status !== 'rejected' && (
                  <button onClick={() => onReject(s.id)} className="px-2 py-1 rounded bg-rose-600 text-white hover:opacity-90" title="Refuser">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                {s.status !== 'pending' && (
                  <button onClick={() => onPending(s.id)} className="px-2 py-1 rounded bg-gray-100 text-gray-800 hover:bg-gray-200 border" title="Remettre en attente">
                    <Clock className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSallesPage;
