// src/lib/search.ts
import { supabase } from '../lib/supabase';

export async function searchOffresAutour(opts: {
  lat: number;
  lon: number;
  rayonKm: number;
  q?: string;
  specialites?: string[];
  limit?: number;
  offset?: number;
}) {
  const { lat, lon, rayonKm, q = null, specialites = null, limit = 20, offset = 0 } = opts;

  const { data, error } = await supabase.rpc('search_offres_autour', {
    p_lat: lat,
    p_lon: lon,
    p_rayon_km: rayonKm,
    p_q: q,
    p_specialites: specialites,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;
  return data; // liste d'offres
}
