import React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type ToastItem = {
  id: string;
  title: string;
  body?: string;
  href?: string;      // lien vers le chat
  ttl?: number;       // durée d’affichage ms
};

type Ctx = {
  newCount: number;
  hasNew: boolean;
  reset: () => void;

  // toasts
  toasts: ToastItem[];
  dismiss: (id: string) => void;
  push: (t: Omit<ToastItem, 'id'>) => void;
};

const NotificationsContext = React.createContext<Ctx>({
  newCount: 0,
  hasNew: false,
  reset: () => {},
  toasts: [],
  dismiss: () => {},
  push: () => {},
});

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const me = session?.user?.id ?? null;

  const [newCount, setNewCount] = React.useState(0);
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const hasNew = newCount > 0;

  // Cache des noms par userId pour éviter de requêter à chaque toast
  const nameCache = React.useRef<Map<string, string>>(new Map());

  const reset = React.useCallback(() => setNewCount(0), []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID();
    const item: ToastItem = { id, ttl: 4000, ...t };
    setToasts((prev) => [...prev, item]);

    // auto-dismiss
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, item.ttl);
  }, []);

  // Abonnement Realtime : nouveau message
  React.useEffect(() => {
    if (!me) return;

    const channel = supabase
      .channel('notif:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const m = payload.new as { author_id?: string; conversation_id?: string; content?: string } | null;
          if (!m || !m.author_id || m.author_id === me) return; // ignore mes propres messages

          setNewCount((c) => c + 1);

          // Récupère le nom de l’auteur (avec cache)
          let authorName = nameCache.current.get(m.author_id) ?? '';
          if (!authorName) {
            const { data: u } = await supabase
              .from('users')
              .select('id, nom')
              .eq('id', m.author_id)
              .maybeSingle();
            authorName = u?.nom || 'Nouveau message';
            nameCache.current.set(m.author_id, authorName);
          }

          // Toast
          const body =
            (m.content && m.content.length > 80 ? m.content.slice(0, 77) + '…' : m.content) || 'Message reçu';
          push({
            title: `💬 ${authorName}`,
            body,
            href: m.conversation_id ? `/chat/${m.conversation_id}` : undefined,
          });

          // petite vibration (mobile)
          try { navigator.vibrate?.(25); } catch {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, push]);

  const value = React.useMemo(
    () => ({ newCount, hasNew, reset, toasts, dismiss, push }),
    [newCount, hasNew, reset, toasts, dismiss, push]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => React.useContext(NotificationsContext);

/* -------- UI des toasts (à placer une seule fois dans App) -------- */
export const Toasts: React.FC = () => {
  const { toasts, dismiss } = useNotifications();

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="w-[320px] max-w-[90vw] rounded-lg shadow-lg border bg-white overflow-hidden animate-[toast-in_200ms_ease]"
          style={{
            // micro animation fallback si Tailwind pas dispo
            animationName: 'toast-in',
            animationDuration: '180ms',
          }}
        >
          <button
            onClick={() => {
              if (t.href) window.location.href = t.href;
              dismiss(t.id);
            }}
            className="w-full text-left p-3 hover:bg-gray-50"
            title="Ouvrir la conversation"
          >
            <div className="font-semibold">{t.title}</div>
            {t.body ? <div className="text-sm text-gray-600 mt-0.5">{t.body}</div> : null}
          </button>

          <div className="flex items-center justify-end gap-2 px-3 py-2 border-t bg-gray-50">
            <button
              onClick={() => dismiss(t.id)}
              className="text-xs text-gray-500 hover:text-gray-700"
              aria-label="Fermer"
            >
              Fermer
            </button>
            {t.href && (
              <a
                href={t.href}
                className="text-xs text-blue-600 hover:underline"
                onClick={() => dismiss(t.id)}
              >
                Ouvrir
              </a>
            )}
          </div>
        </div>
      ))}

      {/* petite animation keyframes inline (fallback) */}
      <style>{`
        @keyframes toast-in {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  );
};
