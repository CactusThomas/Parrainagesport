import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ProfileCard from './ProfileCard';

type Props = {
  lat: number | null;
  lon: number | null;
  rayonKm: number;
  q: string | null;                  // recherche libre (salle/chaîne/coach)
  type: 'coach' | 'adherent' | null; // null = tous
  page: number;
  pageSize?: number;                 // défaut 12
  onPageChange: (nextPage: number) => void;
};

type ProfilRow = {
  user_id: string;
  nom: string;
  type_utilisateur: 'coach' | 'adherent';
  est_booste: boolean | null;
  photo_url: string | null;

  // côté salle
  salle_id: string | null;
  salle_nom: string | null;
  salle_adresse: string | null;
  latitude: number | null;
  longitude: number | null;

  // affichage
  description: string | null;
  // … ajoute d’autres champs si ta fonction RPC les renvoie
};

const OffresAutourPanel: React.FC<Props> = ({
  lat, lon, rayonKm, q, type, page, pageSize = 12, onPageChange,
}) => {
  const [rows, setRows] = React.useState<ProfilRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sait-on lancer une recherche ?
  const canSearch = lat != null && lon != null;

  async function fetchRows() {
    if (!canSearch) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Appelle ta fonction RPC côté DB : search_profils_autour
      // Ordre serveur: boostés d’abord, puis distance, puis récents
      const { data, error } = await supabase.rpc('search_profils_autour', {
        p_lat: lat,
        p_lon: lon,
        p_rayon_km: rayonKm,
        p_q: q,
        p_type: type,         // null => tous
        p_specialites: null,  // non utilisé ici
        p_ville: null,        // non utilisé ici (on passe lat/lon directement)
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize,
      });

      if (error) throw error;
      setRows((data || []) as ProfilRow[]);
    } catch (e: any) {
      console.error('[offres] rpc error:', e);
      setError(e?.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, rayonKm, q, type, page, pageSize]);

  const hasNextPage = rows.length === pageSize; // heuristique simple

  return (
    <section className="bg-white rounded-xl shadow p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Offres autour de vous</h2>
        <div className="text-sm text-gray-500">
          {canSearch
            ? <>Résultats dans un rayon de <strong>{rayonKm} km</strong></>
            : <>Commencez par sélectionner une ville</>}
        </div>
      </div>

      {!canSearch && (
        <div className="text-gray-500 text-sm">
          Astuce : tapez une ville, choisissez un rayon, éventuellement un type et une recherche libre.
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-28 bg-gray-100 rounded mb-3" />
              <div className="h-4 bg-gray-100 rounded mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {!loading && !error && rows.length === 0 && canSearch && (
        <div className="text-gray-600 text-sm">
          Aucune offre trouvée avec ces critères.
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rows.map((p) => (
              <ProfileCard
                key={p.user_id}
                id={p.user_id}
                nom={p.nom}
                type={p.type_utilisateur}
                photoUrl={p.photo_url || undefined}
                estBooste={!!p.est_booste}
                salleNom={p.salle_nom || undefined}
                salleAdresse={p.salle_adresse || undefined}
                description={p.description || undefined}
              >
                {/* Lien vers page publique */}
                <div className="mt-3">
                  <Link
                    to={`/u/${p.user_id}`}
                    className="text-[#2746F5] text-sm hover:underline"
                  >
                    Voir la page publique
                  </Link>
                </div>
              </ProfileCard>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
            >
              Précédent
            </button>

            <div className="text-sm text-gray-600">
              Page <strong>{page}</strong>
            </div>

            <button
              className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNextPage || loading}
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export default OffresAutourPanel;
