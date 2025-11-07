import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
  label?: string;
  placeholder?: string;
};

export default function SpecialitesSelector({
  value, onChange, max = 8, label = 'Spécialités', placeholder = 'Rechercher...'
}: Props) {
  const [all, setAll] = useState<string[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      // On suppose specialites_ref(nom text unique)
      const { data } = await supabase.from('specialites_ref').select('nom').order('nom');
      setAll((data || []).map((d:any) => d.nom));
    })();
  }, []);

  const filtered = all.filter(s =>
    s.toLowerCase().includes(q.toLowerCase()) && !value.includes(s)
  ).slice(0, 10);

  function add(spec: string) {
    if (value.length >= max) return;
    onChange([...value, spec]);
    setQ('');
  }
  function remove(spec: string) {
    onChange(value.filter(v => v !== spec));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {value.map((v) => (
          <span key={v} className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm">
            {v}
            <button className="ml-2 text-blue-600 hover:text-blue-800" onClick={() => remove(v)}>×</button>
          </span>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border rounded"
      />
      {q && filtered.length > 0 && (
        <div className="border rounded p-2 space-y-1 max-h-48 overflow-auto bg-white">
          {filtered.map((s) => (
            <div
              key={s}
              className="cursor-pointer px-2 py-1 hover:bg-gray-100 rounded"
              onClick={() => add(s)}
            >
              {s}
            </div>
          ))}
        </div>
      )}
      <div className="text-xs text-gray-500">{value.length}/{max} sélectionnées</div>
    </div>
  );
}
