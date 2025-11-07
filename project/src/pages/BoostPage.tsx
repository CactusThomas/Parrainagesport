import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_STRIPE_SERVER_URL || 'https://parrainsport-stripe-server.onrender.com';

const BoostPage: React.FC = () => {
  const { session, profile } = useAuth();
  const uid = session?.user?.id ?? null;

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startCheckout = async () => {
    if (!uid) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, email: profile?.email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur serveur');
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    if (!uid) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Erreur serveur');
      window.location.href = json.url;
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const boosted = !!profile?.est_booste;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Booster mon profil</h1>
      <p className="text-gray-600 mb-6">
        Mettez en avant votre profil dans les résultats et gagnez en visibilité.
      </p>

      {error && <div className="mb-4 rounded bg-rose-50 text-rose-700 px-3 py-2">{error}</div>}

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">Abonnement mensuel</div>
            <div className="text-gray-600">Annulable à tout moment</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">11,89 €</div>
            <div className="text-xs text-gray-500">par mois</div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {!boosted ? (
            <button
              onClick={startCheckout}
              disabled={loading || !uid}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Redirection…' : 'Souscrire'}
            </button>
          ) : (
            <>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm">
                Profil boosté actif
              </span>
              <button
                onClick={openPortal}
                disabled={loading || !uid}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Gérer mon abonnement
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoostPage;
