import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type VilleRef = {
  slug: string;
  nom: string;
  pays: string;
  latitude: number;
  longitude: number;
  population: number | null;
};

type Props = {
  value: VilleRef | null;
  onChange: (v: VilleRef | null) => void;
  placeholder?: string;
};

export default function VilleAutocomplete({ value, onChange, placeholder }: Props) {
  const [term, setTerm] = useState('');
  const [items, setItems] = useState<VilleRef[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!term || term.length < 2) { setItems([]); return; }
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('villes_ref')
        .select('slug, nom, pays, latitude, longitude, population')
        .or(`nom.ilike.%${term}%,slug.ilike.%${term}%`)
        .order('population', { ascending: false })
        .limit(10);
      setLoading(false);
      if (!active) return;
      if (error) { console.error(error); setItems([]); return; }
      setItems(data as VilleRef[]);
      setOpen(true);
    })();
    return () => { active = false; };
  }, [term]);

  return (
    <div className="relative">
      <input
        value={value ? `${value.nom} (${value.pays})` : term}
        onChange={(e) => { onChange(null); setTerm(e.target.value); }}
        onFocus={() => setOpen(items.length > 0)}
        placeholder={placeholder ?? 'Ville...'}
        className="w-full border rounded px-3 py-2"
      />
      {open && items.length > 0 && (
        <div className="absolute z-20 bg-white border rounded mt-1 w-full max-h-64 overflow-auto shadow">
          {loading && <div className="px-3 py-2 text-sm text-gray-500">Chargement…</div>}
          {items.map(v => (
            <button
              key={v.slug}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => { onChange(v); setTerm(''); setOpen(false); }}
            >
              <div className="font-medium">{v.nom} <span className="text-gray-500 text-sm">({v.pays})</span></div>
              {v.population ? <div className="text-xs text-gray-500">pop. {v.population.toLocaleString('fr-FR')}</div> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
