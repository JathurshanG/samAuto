'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AddNewVehiclePage() {
  const [form, setForm] = useState({
    nom: '',
    marque: '',
    annee: '',
    prix: '',
    image_url: '',
    description: '',
    disponible: false,
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.from('vehicules').insert([form]);

    setLoading(false);

    if (error) {
      setMessage("Erreur : " + error.message);
    } else {
      setMessage("Véhicule ajouté avec succès !");
      setForm({
        nom: '',
        marque: '',
        annee: '',
        prix: '',
        image_url: '',
        description: '',
        disponible: false,
      });
    }
  };

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ajouter un véhicule</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Nom', name: 'nom' },
          { label: 'Marque', name: 'marque' },
          { label: 'Année', name: 'annee', type: 'number' },
          { label: 'Prix', name: 'prix', type: 'number' },
          { label: 'Image URL', name: 'image_url' },
          { label: 'Description', name: 'description' },
        ].map(({ label, name, type = 'text' }) => (
          <div key={name}>
            <label className="block font-medium">{label}</label>
            <input
              type={type}
              name={name}
              value={form[name]}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
        ))}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="disponible"
            checked={form.disponible}
            onChange={handleChange}
          />
          <label htmlFor="disponible">Disponible</label>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Ajout en cours...' : 'Ajouter le véhicule'}
        </button>

        {message && <p className="mt-4">{message}</p>}
      </form>
    </main>
  );
}
