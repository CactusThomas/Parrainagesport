import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSearchOffres(params?: {
  lat: number; lon: number; rayonKm: number;
  q?: string; specialites?: string[]; limit?: number; page?: number;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      if (!params) return;
      setLoading(true); setError(null);
      try {
        const { lat, lon, rayonKm, q=null, specialites=null, limit=20, page=1 } = params;
        const offset = (page - 1) * limit;
        const { data, error } = await supabase.rpc('search_offres_autour', {
          p_lat: lat, p_lon: lon, p_rayon_km: rayonKm,
          p_q: q, p_specialites: specialites, p_limit: limit, p_offset: offset
        });
        if (error) throw error;
        setRows(data ?? []);
      } catch (e:any) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [JSON.stringify(params)]);

  return { rows, loading, error };
}
