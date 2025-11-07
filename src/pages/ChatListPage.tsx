import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { MessageSquare, ChevronRight, Loader2 } from 'lucide-react';

type Conversation = {
  id: string;
  user_a: string;
  user_b: string;
  salle_id: string | null;
  status: 'requested' | 'open' | 'closed';
  created_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type MiniUser = {
  id: string;
  nom: string | null;
  photo_url: string | null;
  type_utilisateur: 'adherent' | 'coach' | 'admin';
};

type Row = {
  conv: Conversation;
  peer: MiniUser | null;
  last?: Message;
  unread: number;
};

const fmtTimeShort = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { reset } = useNotifications();
  const me = session?.user?.id;

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [filter, setFilter] = React.useState('');

  // ✅ Réinitialiser le badge dès l’ouverture de la page
  React.useEffect(() => { reset(); }, [reset]);

  const loadAll = React.useCallback(async () => {
    if (!me) return;

    setLoading(true);

    // 1) conversations où je participe
    const { data: convs, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .or(`user_a.eq.${me},user_b.eq.${me}`)
      .order('created_at', { ascending: false });

    if (convErr) {
      console.error('load convs error', convErr);
      setRows([]);
      setLoading(false);
      return;
    }

    const convList = (convs ?? []) as Conversation[];
    if (convList.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    // 2) profils des correspondants
    const peerIds = Array.from(new Set(convList.map((c) => (c.user_a === me ? c.user_b : c.user_a))));
    const { data: peersData } = await supabase
      .from('users')
      .select('id, nom, photo_url, type_utilisateur')
      .in('id', peerIds);

    const peerMap = new Map((peersData ?? []).map((p: any) => [p.id, p as MiniUser]));

    // 3) derniers messages (rapide : on trie côté client)
    const convIds = convList.map((c) => c.id);
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    const lastByConv = new Map<string, Message>();
    (messagesData ?? []).forEach((m: any) => {
      if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m as Message);
    });

    // 4) non-lus simples (read_at null & auteur != moi)
    const { data: unreadData } = await supabase
      .from('messages')
      .select('id, conversation_id, author_id, read_at')
      .in('conversation_id', convIds)
      .is('read_at', null)
      .neq('author_id', me);

    const unreadCount = new Map<string, number>();
    (unreadData ?? []).forEach((m: any) => {
      const k = m.conversation_id as string;
      unreadCount.set(k, (unreadCount.get(k) ?? 0) + 1);
    });

    const merged: Row[] = convList.map((c) => ({
      conv: c,
      peer: peerMap.get(c.user_a === me ? c.user_b : c.user_a) ?? null,
      last: lastByConv.get(c.id),
      unread: unreadCount.get(c.id) ?? 0,
    }));

    // Trier par dernier message ou création
    merged.sort((a, b) => {
      const ta = a.last?.created_at ?? a.conv.created_at;
      const tb = b.last?.created_at ?? b.conv.created_at;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });

    setRows(merged);
    setLoading(false);
  }, [me]);

  React.useEffect(() => { if (me) loadAll(); }, [me, loadAll]);

  // Realtime : rafraîchir à chaque nouveau msg / update conv
  React.useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel('chatlist')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, loadAll)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, loadAll)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, loadAll)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, loadAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [me, loadAll]);

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.peer?.nom ?? '').toLowerCase().includes(q));
  }, [rows, filter]);

  if (!me) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-gray-600">Veuillez vous connecter.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-3xl mx-auto h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h1 className="font-semibold">Mes conversations</h1>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-blue-600 hover:underline">
            Accueil
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="mb-4">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Rechercher par nom…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500">Aucune conversation pour l’instant.</div>
        ) : (
          <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
            {filtered.map((r) => {
              const p = r.peer;
              const preview = r.last?.content ?? 'Nouvelle conversation';
              const time = r.last?.created_at ?? r.conv.created_at;

              return (
                <li key={r.conv.id}>
                  <Link to={`/chat/${r.conv.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    {p?.photo_url ? (
                      <img src={p.photo_url} alt={p.nom ?? 'Profil'} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium truncate">
                          {p?.nom ?? 'Utilisateur'}
                          {p?.type_utilisateur ? <span className="ml-2 text-xs text-gray-500">· {p.type_utilisateur}</span> : null}
                        </div>
                        <div className="text-xs text-gray-500 shrink-0">{fmtTimeShort(time)}</div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm text-gray-600 truncate">{preview}</div>
                        {r.unread > 0 && (
                          <span className="ml-2 shrink-0 inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-blue-600 text-white text-xs px-1">
                            {r.unread}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatListPage;
