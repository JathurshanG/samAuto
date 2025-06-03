'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function VoituresPage() {
  const [voitures, setVoitures] = useState([]);
  const [filtreMarque, setFiltreMarque] = useState('');
  const [filtreNom, setFiltreNom] = useState('');
  const [loading, setLoading] = useState(true);
  const [marques, setMarques] = useState([]);
  const [noms, setNoms] = useState([]);

  useEffect(() => {
    async function fetchData() {
      
      const { data, error } = await supabase
        .from('vehicules')
        .select('*')
        .eq('disponible', true)
        .order('created_at', { ascending: false });

      if (!error) {
        console.log('Données véhicules :', data);        
        setVoitures(data);
        const allMarques = [...new Set(data.map(v => v.marque).filter(Boolean))];
        const allNoms = [...new Set(data.map(v => v.nom).filter(Boolean))];
        setMarques(allMarques);
        setNoms(allNoms);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const voituresFiltrees = voitures.filter((v) => {
    return (
      (filtreMarque === '' || v.marque === filtreMarque) &&
      (filtreNom === '' || v.nom === filtreNom)
    );
  });

  return (
    <main className="flex flex-col md:flex-row max-w-7xl mx-auto p-6 space-y-6 md:space-y-0 md:space-x-6">
      {/* Sidebar Filtres */}
      <aside className="w-full md:w-64 border rounded p-4 shadow-sm bg-white">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>

        <div className="mb-4">
          <label className="block font-medium mb-1">Marque</label>
          <select
            className="w-full border p-2 rounded"
            value={filtreMarque}
            onChange={(e) => setFiltreMarque(e.target.value)}
          >
            <option value="">Toutes les marques</option>
            {marques.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Modèle</label>
          <select
            className="w-full border p-2 rounded"
            value={filtreNom}
            onChange={(e) => setFiltreNom(e.target.value)}
          >
            <option value="">Tous les modèles</option>
            {noms.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* Grille des voitures */}
      <section className="flex-1">
        <h1 className="text-2xl font-bold mb-4">Véhicules disponibles</h1>

        {loading ? (
          <p>Chargement...</p>
        ) : voituresFiltrees.length === 0 ? (
          <p>Aucun véhicule ne correspond aux filtres.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {voituresFiltrees.map((v) => (
              <div key={v.id} className="border rounded shadow-sm overflow-hidden hover:shadow-lg transition">
                <img
                  src={v.image_urls?.[0] || '/placeholder.png'}
                  alt={v.nom}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-lg font-semibold">{v.nom}</h2>
                  <p className="text-sm text-gray-600">{v.marque} • {v.annee}</p>
                  <p className="text-blue-600 font-bold mt-1">{v.prix} €</p>
                  <p className="text-sm text-gray-700">{v.kilometrage} km • {v.energie}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
