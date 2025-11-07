import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, MapPin, Dumbbell, ArrowLeft, Star } from 'lucide-react';

type PublicProfile = {
  user_id: string;
  nom: string;
  type_utilisateur: 'coach' | 'adherent' | 'admin';
  description: string | null;
  photo_url: string | null;
  specialites: string[] | null;
  salle_nom: string | null;
  salle_chaine: string | null;
  ville_slug: string | null;
  est_booste: boolean;
};

const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profil, setProfil] = React.useState<PublicProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('offres_auto')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();

      if (error) console.error(error);
      setProfil(data as any);
      setLoading(false);
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Chargement du profil…
      </div>
    );
  }

  if (!profil) {
    return (
      <div className="p-8 text-center text-gray-500">
        Profil introuvable ou non publié.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4 mb-4">
          {profil.photo_url ? (
            <img
              src={profil.photo_url}
              alt={profil.nom}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#27ADF5] to-[#2746F5] flex items-center justify-center text-white text-3xl font-bold">
              {profil.nom[0]}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {profil.nom}
              {profil.est_booste && (
                <Star className="w-5 h-5 text-[#27ADF5] fill-[#27ADF5]" />
              )}
            </h1>
            <p className="capitalize text-gray-600">
              {profil.type_utilisateur === 'coach' ? 'Coach sportif' : 'Adhérent'}
            </p>
            {profil.ville_slug && (
              <p className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4" /> {profil.ville_slug}
              </p>
            )}
          </div>
        </div>

        {profil.description && (
          <div className="mb-4">
            <h2 className="font-semibold mb-1">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{profil.description}</p>
          </div>
        )}

        {profil.specialites && profil.specialites.length > 0 && (
          <div className="mb-4">
            <h2 className="font-semibold mb-1 flex items-center gap-1">
              <Dumbbell className="w-4 h-4" /> Spécialités
            </h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {profil.specialites.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-blue-50 text-[#27ADF5] text-sm rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {profil.salle_nom && (
          <div className="mb-4">
            <h2 className="font-semibold mb-1">Salle de sport</h2>
            <p className="text-gray-700">
              {profil.salle_nom}
              {profil.salle_chaine && ` · ${profil.salle_chaine}`}
            </p>
          </div>
        )}

        <div className="pt-4 border-t flex justify-between items-center">
          <Link
            to="/"
            className="text-sm text-gray-600 hover:underline"
          >
            Retour à l’accueil
          </Link>
          <a
            href={`mailto:${profil.nom}@example.com`}
            className="flex items-center gap-2 px-4 py-2 bg-[#27ADF5] text-white rounded-lg hover:bg-[#2090c5] transition-colors"
          >
            <Mail className="w-4 h-4" /> Contacter
          </a>
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
