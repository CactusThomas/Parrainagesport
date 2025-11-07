import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export type NearbyParams = {
  lat?: number;
  lon?: number;
  rayonKm: number;        // ex. 5, 10, 25
  q?: string;             // recherche libre (optionnel)
  specialites?: string[]; // filtre coach (optionnel)
  limit?: number;
  offset?: number;
  villeSlug?: string;     // si on passe une ville au lieu d'un lat/lon
};

type VilleRef = { slug: string; nom: string; lat: number; lon: number; pays: string };

export function useNearbyOffers(params: NearbyParams) {
  const { rayonKm, q, specialites, limit = 20, offset = 0, lat, lon, villeSlug } = params;

  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(
    lat != null && lon != null ? { lat, lon } : null
  );
  const [ville, setVille] = useState<VilleRef | null>(null);

  const [data, setData] = useState<any[] | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Résolution ville -> coord.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (villeSlug) {
          const { data: v, error } = await supabase
            .from('villes_ref')
            .select('slug, nom, lat, lon, pays')
            .eq('slug', villeSlug)
            .maybeSingle();

          if (error) throw error;
          if (!cancelled) {
            setVille(v ?? null);
            setCenter(v ? { lat: v.lat, lon: v.lon } : null);
          }
        } else if (lat != null && lon != null) {
          setVille(null);
          setCenter({ lat, lon });
        } else {
          setVille(null);
          setCenter(null);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      }
    })();

    return () => { cancelled = true; };
  }, [villeSlug, lat, lon]);

  const canQuery = useMemo(() => {
    return !!center && rayonKm > 0;
  }, [center, rayonKm]);

  // Appel RPC
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!canQuery) { setData([]); setCount(0); return; }
      setLoading(true); setError(null);

      try {
        const payload = {
          p_lat: center!.lat,
          p_lon: center!.lon,
          p_rayon_km: rayonKm,
          p_q: q ?? null,
          p_specialites: specialites && specialites.length ? specialites : null,
          p_limit: limit,
          p_offset: offset,
        };

        const { data: rows, error } = await supabase.rpc('search_offres_autour', payload);

        if (error) throw error;
        if (!cancelled) {
          setData(rows ?? []);
          setCount((rows ?? []).length); // si besoin d'un vrai total : prévoir une RPC count
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [canQuery, center, rayonKm, q, JSON.stringify(specialites), limit, offset]);

  return {
    data,
    count,
    loading,
    error,
    center,   // {lat, lon} utilisé pour afficher “à X km”
    ville,    // info de la ville choisie (si villeSlug)
  };
}
