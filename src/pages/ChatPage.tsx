import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';

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

type PeerProfile = {
  id: string;
  nom: string | null;
  photo_url: string | null;
  type_utilisateur: 'adherent' | 'coach' | 'admin';
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });

const ChatPage: React.FC = () => {
  const { id: convId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { reset } = useNotifications();
  const me = session?.user?.id;

  const [conv, setConv] = React.useState<Conversation | null>(null);
  const [peer, setPeer] = React.useState<PeerProfile | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  // ✅ Réinitialiser le badge dès l’entrée sur la page
  React.useEffect(() => { reset(); }, [reset]);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);
  React.useEffect(scrollToBottom, [messages, scrollToBottom]);

  // 1) Charger la conversation + peer
  React.useEffect(() => {
    if (!convId || !me) return;
    (async () => {
      const { data: c, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .maybeSingle<Conversation>();

      if (error || !c || (c.user_a !== me && c.user_b !== me)) {
        navigate('/messages');
        return;
      }
      setConv(c);

      const peerId = c.user_a === me ? c.user_b : c.user_a;
      const { data: peerData } = await supabase
        .from('users')
        .select('id, nom, photo_url, type_utilisateur')
        .eq('id', peerId)
        .maybeSingle<PeerProfile>();
      if (peerData) setPeer(peerData);
    })();
  }, [convId, me, navigate]);

  // 2) Charger l’historique
  React.useEffect(() => {
    if (!convId || !me) return;
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (!error) setMessages((data as Message[]) || []);
    })();
  }, [convId, me]);

  // 3) Realtime des nouveaux messages
  React.useEffect(() => {
    if (!convId) return;
    const channel = supabase
      .channel(`room:${convId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [convId]);

  const sendMessage = async () => {
    if (!convId || !me) return;
    const content = text.trim();
    if (!content) return;

    setSending(true);
    setText('');

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversation_id: convId,
      author_id: me,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, author_id: me, content })
      .select('*')
      .maybeSingle<Message>();

    if (error || !data) {
      // rollback si échec
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(content);
    } else {
      // remplace l’optimiste par le vrai
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    }

    setSending(false);
  };

  if (!conv || !me) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-medium">Discussion</div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-6 text-gray-500">Chargement…</div>
      </div>
    );
  }

  const isMine = (m: Message) => m.author_id === me;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            {peer?.photo_url ? (
              <img src={peer.photo_url} alt={peer.nom ?? 'Profil'} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200" />
            )}
            <div className="leading-tight">
              <div className="font-medium">
                {peer?.nom ?? 'Utilisateur'}
                {peer?.type_utilisateur ? <span className="ml-2 text-xs text-gray-500">· {peer.type_utilisateur}</span> : null}
              </div>
              <Link to={`/p/${peer?.id ?? ''}`} className="text-xs text-[#2563eb] hover:underline">
                Voir le profil public
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={listRef} className="max-w-3xl mx-auto w-full flex-1 px-4 py-4 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">Démarrez la conversation en envoyant un message 👋</div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${isMine(m) ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[76%] rounded-2xl px-3 py-2 text-sm shadow
                ${isMine(m) ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm'}
              `}
              title={fmtTime(m.created_at)}
            >
              <div className="whitespace-pre-wrap break-words">{m.content}</div>
              <div className={`mt-1 text-[10px] opacity-70 ${isMine(m) ? 'text-blue-100' : 'text-gray-500'}`}>
                {fmtTime(m.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!sending) sendMessage();
        }}
        className="bg-white border-t"
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un message…"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-lg px-3 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
