// src/components/SallePicker.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Salle = {
  id: string;
  nom: string;
  chaine: string | null;
  adresse: string | null;
  ville: string | null;           // si la colonne n’existe pas chez toi, remplace par `ville?: string | null`
  status: 'approved' | 'pending' | 'rejected';
  created_by: string | null;
};

type Props = {
  /** Salle actuellement sélectionnée (ou null) */
  value: Salle | null;
  /** Callback quand l’utilisateur choisit une salle */
  onChange: (salle: Salle | null) => void;
  /** Ouvre le modal d’ajout de salle */
  onAddSalle: () => void;
  /** Placeholder de la barre de recherche (optionnel) */
  placeholder?: string;
  /** Nombre max de résultats (défaut: 20) */
  limit?: number;
};

const SallePicker: React.FC<Props> = ({
  value,
  onChange,
  onAddSalle,
  placeholder = 'Rechercher par nom, chaîne, adresse ou ville…',
  limit = 20,
}) => {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Salle[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  // Petit debounce basique
  const debounce = useMemo(() => {
    let t: any;
    return (fn: () => void, delay = 300) => {
      clearTimeout(t);
      t = setTimeout(fn, delay);
    };
  }, []);

  // Recherche
  useEffect(() => {
    // si la recherche est vide, on affiche rien (sauf la salle sélectionnée)
    if (!q || q.trim().length < 2) {
      setRows([]);
      setFirstLoad(false);
      return;
    }

    debounce(async () => {
      setLoading(true);
      try {
        const like = `%${q.trim()}%`.toLowerCase();
        // RLS côté DB : on verra les salles "approved" + nos "pending" si on en a
        let query = supabase
          .from('salles')
          .select('id, nom, chaine, adresse, ville, status, created_by')
          .or(
            `nom.ilike.${like},chaine.ilike.${like},adresse.ilike.${like},ville.ilike.${like}`
          )
          .order('nom', { ascending: true })
          .limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        setRows((data || []) as Salle[]);
      } catch (e) {
        console.error('[SallePicker] fetch error:', e);
        setRows([]);
      } finally {
        setLoading(false);
        setFirstLoad(false);
      }
    }, 300);
  }, [q, limit, debounce]);

  return (
    <div className="space-y-2">
      {/* Bandeau de la salle sélectionnée */}
      {value ? (
        <div className="p-3 rounded border bg-gray-50 flex items-start justify-between gap-3">
          <div>
            <div className="font-medium">{value.nom}</div>
            {value.chaine && <div className="text-sm text-gray-600">{value.chaine}</div>}
            {(value.adresse || value.ville) && (
              <div className="text-sm text-gray-500">
                {[value.adresse, value.ville].filter(Boolean).join(' • ')}
              </div>
            )}
            {value.status !== 'approved' && (
              <div className="text-xs text-amber-600 mt-1">Statut&nbsp;: {value.status}</div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className="px-3 py-2 border rounded hover:bg-gray-50"
              onClick={() => onChange(null)}
            >
              Retirer
            </button>
          </div>
        </div>
      ) : null}

      {/* Barre de recherche */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border rounded-lg"
      />

      {/* Résultats */}
      {loading && (
        <div className="text-sm text-gray-500">Recherche…</div>
      )}

      {!loading && q.trim().length >= 2 && rows.length > 0 && (
        <ul className="border rounded-lg divide-y max-h-64 overflow-auto bg-white">
          {rows.map((s) => (
            <li
              key={s.id}
              className="p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => onChange(s)}
            >
              <div className="font-medium">{s.nom}</div>
              <div className="text-sm text-gray-600">
                {s.chaine ? `${s.chaine} • ` : ''}
                {[s.adresse, s.ville].filter(Boolean).join(' ')}
              </div>
              {s.status !== 'approved' && (
                <div className="text-xs text-amber-600 mt-1">
                  Statut : {s.status}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Aucun résultat */}
      {!loading && !firstLoad && q.trim().length >= 2 && rows.length === 0 && (
        <div className="text-sm text-gray-500">Aucune salle trouvée.</div>
      )}

      {/* Ajout d’une salle */}
      <button
        type="button"
        onClick={onAddSalle}
        className="text-sm text-blue-600 hover:underline"
      >
        + Ajouter une salle manquante
      </button>
    </div>
  );
};

export default SallePicker;
