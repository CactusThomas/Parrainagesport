import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

type Salle = {
  id: string;
  nom: string;
  chaine: string | null;
  adresse: string | null;
  ville: string | null;
  status: 'approved' | 'pending';
  created_by: string;
};

const AddSalleModal: React.FC<{
  onClose: () => void;
  onCreated: (salle: Salle) => void;
}> = ({ onClose, onCreated }) => {
  const [nom, setNom] = useState('');
  const [chaine, setChaine] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [saving, setSaving] = useState(false);

  const canSubmit = nom.trim().length >= 2 && ville.trim().length >= 2;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setSaving(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error('Non connecté');

      const payload = {
        nom: nom.trim(),
        chaine: chaine.trim() || null,
        adresse: adresse.trim() || null,
        ville: ville.trim(),
        status: 'pending',
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from('salles')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      onCreated(data as Salle);
    } catch (e: any) {
      console.error('[salle] create error:', e);
      alert(e?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-bold mb-4">Ajouter une salle</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nom *</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex : Basic-Fit Lyon Part-Dieu"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Chaîne</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={chaine}
              onChange={(e) => setChaine(e.target.value)}
              placeholder="Basic-Fit, KeepCool, Fitness Park…"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Adresse</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Numéro et rue"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Ville *</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Ex : Lyon"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Créer'}
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          * Les champs marqués d’un astérisque sont obligatoires. La salle sera
          d’abord enregistrée en <strong>pending</strong> puis validée.
        </p>
      </div>
    </div>
  );
};

export default AddSalleModal;
