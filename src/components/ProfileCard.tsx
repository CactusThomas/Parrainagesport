import React from 'react';
import { Building2, Star, User } from 'lucide-react';

export type ProfileRow = {
  // Champs côté vue offres_profiles_public
  user_id: string;
  user_nom: string | null;
  type_utilisateur: 'adherent' | 'coach' | 'admin' | null;
  user_description: string | null;
  user_specialites: string[] | null;
  user_photo_url: string | null;
  est_booste: boolean | null;
  user_created_at: string | null;

  salle_id: string;
  salle_nom: string | null;
  salle_chaine: string | null;
  salle_adresse: string | null;
  ville_slug: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function ProfileCard({ row }: { row: ProfileRow }) {
  const date =
    row.user_created_at ? new Date(row.user_created_at).toLocaleDateString() : null;

  const isCoach = row.type_utilisateur === 'coach';

  return (
    <article className="border rounded-xl p-4 bg-white">
      <header className="flex items-start gap-3">
        <Avatar url={row.user_photo_url} fallback={row.user_nom || 'Profil'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">
              {row.user_nom || 'Profil'}
            </h3>
            {row.est_booste ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                <Star className="w-3.5 h-3.5 fill-current" />
                Boosté
              </span>
            ) : null}
            {row.type_utilisateur ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">
                {row.type_utilisateur}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
            {row.user_description || (isCoach
              ? "Coach — ajoute ta philosophie d'entraînement."
              : "Adhérent — ajoute une courte description de ton parrainage.")}
          </p>

          {isCoach && row.user_specialites?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {row.user_specialites.map((sp) => (
                <span
                  key={sp}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs"
                >
                  {sp}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="truncate">
              {row.salle_nom || 'Salle inconnue'}
              {row.salle_chaine ? ` • ${row.salle_chaine}` : ''}
              {row.salle_adresse ? ` — ${row.salle_adresse}` : ''}
            </span>
          </div>

          {date && (
            <div className="mt-2 text-xs text-gray-400">
              Profil créé le {date}
            </div>
          )}
        </div>
      </header>
    </article>
  );
}

function Avatar({ url, fallback }: { url: string | null; fallback: string }) {
  if (!url) {
    return (
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
        <User className="w-6 h-6" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={fallback}
      className="w-12 h-12 rounded-full object-cover shrink-0"
    />
  );
}
