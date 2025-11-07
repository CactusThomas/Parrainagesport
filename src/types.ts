export type Role = 'adherent'|'coach'|'admin';

export type UserProfile = {
  id: string;
  nom: string;
  email: string | null;
  ville: string | null;
  type_utilisateur: Role;
  photo_url: string | null;
  description: string | null;
  id_salle: string | null;
  est_booste: boolean | null;
};
export type Salle = {
  id: string;
  nom: string;
  chaine: string | null;
  adresse: string | null;
  ville: string | null;
  status: 'approved' | 'pending' | 'rejected';
  created_by: string;
  created_at: string;
};
