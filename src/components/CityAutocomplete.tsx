// src/components/SalleAutocomplete.tsx
import React from 'react';
import { supabase } from '../lib/supabase';
import { Building2 } from 'lucide-react';

type Row = { salle_nom: string | null; salle_chaine: string | null };

export default function SalleAutocomplete({
  value,
  onChange,
  placeholder = 'Salle ou chaîne (ex: Basic-Fit)',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState(value);
  const [items, setItems] = React.useState<Row[]>([]);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setQ(value), [value]);

  React.useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) { setItems([]); return; }
      const like = `%${term}%`;
      // utilise ta vue “mini” si elle expose salle_nom/salle_chaine
      const { data } = await supabase
        .from('search_profils_autour_mini')
        .select('salle_nom,salle_chaine')
        .or(`salle_nom.ilike.${like},salle_chaine.ilike.${like}`)
        .not('salle_nom','is',null)
        .limit(10);
      // déduplique
      const seen = new Set<string>();
      const unique = (data ?? []).filter((r) => {
        const key = `${r.salle_nom ?? ''}__${r.salle_chaine ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setItems(unique);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && items.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow max-h-64 overflow-y-auto">
          {items.map((r, i) => {
            const label = `${r.salle_nom ?? ''}${r.salle_chaine ? ` · ${r.salle_chaine}` : ''}`;
            return (
              <button
                key={i}
                onClick={() => { onChange(r.salle_nom ?? ''); setQ(r.salle_nom ?? ''); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
              >
                {label || 'Salle'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
