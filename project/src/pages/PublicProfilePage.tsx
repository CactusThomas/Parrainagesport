import React from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet"; // <-- à installer : npm i react-helmet
import { supabase } from "../lib/supabase";
import { MapPin, Share2, Facebook, Twitter, Link2, MessageCircle } from "lucide-react";

/**
 * Structure simplifiée du profil public
 */
type PublicProfile = {
  id: string;
  nom: string;
  type_utilisateur: "coach" | "adherent";
  description: string | null;
  photo_url: string | null;
  est_booste: boolean;
  specialites: string[] | null;
  salle_nom: string | null;
  salle_adresse: string | null;
  ville: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = React.useState<PublicProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
  const shareUrl = `${baseUrl}/u/${id}`;

  React.useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, nom, type_utilisateur, description, photo_url, est_booste, specialites, created_at, salle_id, salles(nom, adresse, ville, latitude, longitude)"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erreur profil public:", error);
        setProfile(null);
      } else if (data) {
        const p = data as any;
        setProfile({
          id: p.id,
          nom: p.nom,
          type_utilisateur: p.type_utilisateur,
          description: p.description,
          photo_url: p.photo_url,
          est_booste: p.est_booste,
          specialites: p.specialites || [],
          salle_nom: p.salles?.nom || null,
          salle_adresse: p.salles?.adresse || null,
          ville: p.salles?.ville || null,
          latitude: p.salles?.latitude || null,
          longitude: p.salles?.longitude || null,
          created_at: p.created_at,
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-gray-500">
        Chargement du profil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-gray-500">
        Profil introuvable ou supprimé.
      </div>
    );
  }

  const title = `${profile.nom} – ${
    profile.type_utilisateur === "coach" ? "Coach sportif" : "Adhérent"
  } sur ParrainSport`;
  const description =
    profile.description ||
    `Découvrez le profil ${
      profile.type_utilisateur === "coach" ? "du coach" : "de l’adhérent"
    } ${profile.nom} sur ParrainSport.`;
  const image = profile.photo_url || `${baseUrl}/default-avatar.png`;

  const handleShare = async (network: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    switch (network) {
      case "copy":
        await navigator.clipboard.writeText(shareUrl);
        alert("Lien copié !");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, "_blank");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* -------- SEO / META -------- */}
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:url" content={shareUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Helmet>

      {/* -------- HEADER -------- */}
      <header className="bg-white border-b mb-8">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="font-bold text-lg text-[#2746F5]">ParrainSport</a>
        </div>
      </header>

      {/* -------- PROFIL -------- */}
      <main className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex items-center gap-6">
            <img
              src={profile.photo_url || "/default-avatar.png"}
              alt={profile.nom}
              className="w-28 h-28 rounded-full object-cover border"
            />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {profile.nom}
                {profile.est_booste && (
                  <span className="bg-gradient-to-r from-[#27ADF5] to-[#2746F5] text-white text-xs px-2 py-0.5 rounded-full">
                    Boosté
                  </span>
                )}
              </h1>
              <p className="text-gray-600 capitalize">
                {profile.type_utilisateur === "coach" ? "Coach sportif" : "Adhérent"}
              </p>
              {profile.specialites?.length > 0 && (
                <p className="text-sm mt-1 text-gray-500">
                  {profile.specialites.join(" • ")}
                </p>
              )}
            </div>
          </div>

          {/* Salle / ville */}
          {(profile.salle_nom || profile.ville) && (
            <div className="flex items-center gap-2 mt-4 text-gray-700 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>
                {profile.salle_nom && <strong>{profile.salle_nom}</strong>}{" "}
                {profile.ville && <>à {profile.ville}</>}
              </span>
            </div>
          )}

          {/* Description */}
          {profile.description && (
            <p className="mt-4 text-gray-700 leading-relaxed whitespace-pre-line">
              {profile.description}
            </p>
          )}

          {/* Partage */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-semibold mb-2">Partager ce profil</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleShare("copy")}
                className="p-2 rounded border hover:bg-gray-50"
                title="Copier le lien"
              >
                <Link2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare("whatsapp")}
                className="p-2 rounded border hover:bg-gray-50"
                title="Partager sur WhatsApp"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="p-2 rounded border hover:bg-gray-50"
                title="Partager sur Twitter / X"
              >
                <Twitter className="w-5 h-5 text-sky-500" />
              </button>
              <button
                onClick={() => handleShare("facebook")}
                className="p-2 rounded border hover:bg-gray-50"
                title="Partager sur Facebook"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicProfilePage;
