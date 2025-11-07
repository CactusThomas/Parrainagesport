import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin, Search, User2, Users } from 'lucide-react';
import VilleAutocomplete, { VilleOption } from '../components/VilleAutocomplete';
import OffresAutourPanel from '../components/OffresAutourPanel';

/** Utils URL <-> state */
const toNum = (v: string | null, fallback: number) => {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const DEFAULT_RAYON = 20; // km
const DEFAULT_PAGE = 1;
const PAGE_SIZE = 12;

const HomePage: React.FC = () => {
  const [params, setParams] = useSearchParams();

  // --- STATE initialisé depuis les query params
  const [ville, setVille] = React.useState<VilleOption | null>(() => {
    const name = params.get('ville') || null;
    const latitude = params.get('lat');
    const longitude = params.get('lon');
    if (name && latitude && longitude) {
      return {
        nom: name,
        latitude: Number(latitude),
        longitude: Number(longitude),
        pays: params.get('pays') || undefined,
        slug: params.get('slug') || undefined,
      };
    }
    return null;
  });

  const [rayonKm, setRayonKm] = React.useState<number>(() =>
    clamp(toNum(params.get('rayon'), DEFAULT_RAYON), 1, 100)
  );
  const [q, setQ] = React.useState<string>(params.get('q') || '');
  const [type, setType] = React.useState<'all' | 'adherent' | 'coach'>(
    (params.get('type') as any) || 'all'
  );
  const [page, setPage] = React.useState<number>(() =>
    Math.max(1, toNum(params.get('page'), DEFAULT_PAGE))
  );

  // --- Sync state -> URL à chaque changement contrôlé
  const syncParams = React.useCallback(
    (next?: Partial<{ ville: VilleOption | null; rayon: number; q: string; type: string; page: number }>) => {
      const current = new URLSearchParams(params.toString());

      const v = next?.ville === undefined ? ville : next?.ville;
      if (v && v.latitude && v.longitude) {
        current.set('ville', v.nom);
        if (v.slug) current.set('slug', v.slug);
        if (v.pays) current.set('pays', v.pays);
        current.set('lat', String(v.latitude));
        current.set('lon', String(v.longitude));
      } else {
        current.delete('ville'); current.delete('slug'); current.delete('pays');
        current.delete('lat'); current.delete('lon');
      }

      const r = next?.rayon ?? rayonKm;
      current.set('rayon', String(r));

      const qq = next?.q ?? q;
      if (qq) current.set('q', qq); else current.delete('q');

      const t = (next?.type ?? type) as string;
      if (t && t !== 'all') current.set('type', t); else current.delete('type');

      const pg = next?.page ?? page;
      current.set('page', String(pg));

      setParams(current, { replace: true });
    },
    [params, setParams, ville, rayonKm, q, type, page]
  );

  // Quand on modifie un filtre, on revient page 1 + sync URL
  const applyFilters = () => {
    setPage(1);
    syncParams({ page: 1 });
  };

  // Si l'utilisateur tape entrée dans l’input recherche
  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    applyFilters();
  };

  // Quand la ville change via l’autocomplete
  const handleVilleChange = (v: VilleOption | null) => {
    setVille(v);
    setPage(1);
    syncParams({ ville: v, page: 1 });
  };

  // Quand le rayon change
  const handleRayonChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const n = clamp(Number(e.target.value || DEFAULT_RAYON), 1, 100);
    setRayonKm(n);
  };

  // Applique la synchro URL quand q / type / rayon changent via bouton “Rechercher”
  React.useEffect(() => {
    // au premier rendu on n’écrase pas, c’est géré par l’état initial
    // ensuite, seul le bouton applique réellement; ici on ne push pas automatiquement
  }, []);

  // Pagination: quand on clique “next/prev” depuis OffresAutourPanel
  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    syncParams({ page: nextPage });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header ultra simple */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg text-[#2746F5]">ParrainSport</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:underline">Accueil</Link>
            <Link to="/profile" className="hover:underline">Mon profil</Link>
          </nav>
        </div>
      </header>

      {/* Barre de recherche */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Trouvez un parrain ou un coach près de chez vous</h1>
        <p className="text-gray-600 mb-6">
          Recherchez par <strong>ville</strong> et <strong>rayon</strong>, filtrez par type de profil,
          et utilisez le champ “Rechercher” pour un nom de salle/chaîne/coach.
        </p>

        <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ville</label>
              <VilleAutocomplete
                value={ville}
                onChange={handleVilleChange}
                placeholder="Tapez une ville…"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Rayon (km)</label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  min={1}
                  max={100}
                  value={rayonKm}
                  onChange={handleRayonChange}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
              <div className="flex items-center gap-2">
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="all">Tous</option>
                  <option value="adherent">Adhérent</option>
                  <option value="coach">Coach</option>
                </select>
                {type === 'coach'
                  ? <User2 className="w-4 h-4 text-gray-500" />
                  : type === 'adherent'
                    ? <Users className="w-4 h-4 text-gray-500" />
                    : null}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Rechercher</label>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nom de salle / chaîne / coach…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#27ADF5] to-[#2746F5] text-white rounded-lg hover:opacity-90"
              onClick={applyFilters}
            >
              Rechercher
            </button>

            <button
              type="button"
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              onClick={() => {
                setVille(null);
                setRayonKm(DEFAULT_RAYON);
                setQ('');
                setType('all');
                setPage(1);
                syncParams({ ville: null, rayon: DEFAULT_RAYON, q: '', type: 'all', page: 1 });
              }}
            >
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* Résultats */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <OffresAutourPanel
          lat={ville?.latitude ?? null}
          lon={ville?.longitude ?? null}
          rayonKm={rayonKm}
          q={q || null}
          type={type === 'all' ? null : type}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default HomePage;
