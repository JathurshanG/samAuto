'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useDropzone } from 'react-dropzone';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableImage } from './SortableImage';

export default function AddNewVehiclePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nom: '',
    marque: '',
    annee: '',
    prix: '',
    description: '',
    disponible: false,
    kilometrage: '',
    energie: '',
    boite_vitesse: '',
    couleur: '',
  });

  const [imageUrls, setImageUrls] = useState([]);
  const [equipements, setEquipements] = useState([]);
  const [selectedEquipements, setSelectedEquipements] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push('/login');
      }
    }
    checkUser();
  }, [router]);

  useEffect(() => {
    async function fetchEquipements() {
      const { data, error } = await supabase.from('equipements').select('*');
      if (!error) setEquipements(data);
    }
    fetchEquipements();
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      const fileExt = file.name.split('.').pop();
      const filePath = `vehicules/${Date.now()}-${Math.random()}.${fileExt}`;

      const { error } = await supabase.storage.from('vehicules').upload(filePath, file);
      if (!error) {
        const url = supabase.storage.from('vehicules').getPublicUrl(filePath).data.publicUrl;
        setImageUrls((prev) => [...prev, url]);
      } else {
        setMessage('Erreur upload image : ' + error.message);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = imageUrls.findIndex((url) => url === active.id);
      const newIndex = imageUrls.findIndex((url) => url === over.id);
      setImageUrls((urls) => arrayMove(urls, oldIndex, newIndex));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const toggleEquipement = (id) => {
    setSelectedEquipements((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    console.log('USER:', user);
    console.log('AUTH ERROR:', authError);

    if (!user) {
      setMessage("Utilisateur non authentifié.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('vehicules').insert([{
      ...form,
      user_id: user.id,
      annee: parseInt(form.annee),
      prix: parseFloat(form.prix),
      kilometrage: parseInt(form.kilometrage),
      image_urls: imageUrls,
    }]).select('id');

    if (error || !data) {
      setMessage("Erreur : " + error.message);
      setLoading(false);
      return;
    }

    const vehicule_id = data[0].id;

    if (selectedEquipements.length > 0) {
      const relations = selectedEquipements.map((equipement_id) => ({
        vehicule_id,
        equipement_id,
      }));

      const { error: relError } = await supabase.from('vehicule_equipements').insert(relations);
      if (relError) {
        setMessage("Véhicule créé, mais erreur sur les équipements : " + relError.message);
      }
    }

    setMessage("Véhicule ajouté avec succès !");
    setForm({
      nom: '',
      marque: '',
      annee: '',
      prix: '',
      description: '',
      disponible: false,
      kilometrage: '',
      energie: '',
      boite_vitesse: '',
      couleur: '',
    });
    setImageUrls([]);
    setSelectedEquipements([]);
    setLoading(false);
  };

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-2xl font-bold mb-4">Ajouter un véhicule</h1>

        {[{ label: 'Nom', name: 'nom' },
          { label: 'Marque', name: 'marque' },
          { label: 'Année', name: 'annee', type: 'number' },
          { label: 'Prix (€)', name: 'prix', type: 'number' },
          { label: 'Kilométrage', name: 'kilometrage', type: 'number' },
          { label: 'Énergie', name: 'energie' },
          { label: 'Boîte de vitesse', name: 'boite_vitesse' },
          { label: 'Couleur', name: 'couleur' },
          { label: 'Description', name: 'description' }].map(({ label, name, type = 'text' }) => (
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

        <div className="mt-4">
          <p className="font-semibold mb-2">Équipements :</p>
          <div className="grid grid-cols-2 gap-2">
            {equipements.map((eq) => (
              <label key={eq.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedEquipements.includes(eq.id)}
                  onChange={() => toggleEquipement(eq.id)}
                />
                <span>{eq.nom}</span>
              </label>
            ))}
          </div>
        </div>

        <div {...getRootProps()} className="border-2 border-dashed p-4 rounded bg-gray-50 text-center cursor-pointer">
          <input {...getInputProps()} />
          {isDragActive ? <p>Dépose ici...</p> : <p>Glisse plusieurs images ici ou clique</p>}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Ajout en cours...' : 'Ajouter le véhicule'}
        </button>

        {message && <p className="text-sm text-red-600">{message}</p>}
      </form>

      <div className="border rounded p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Aperçu</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={imageUrls} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {imageUrls.map((url) => (
                <SortableImage key={url} id={url} url={url} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <h3 className="text-lg font-bold mt-4">{form.nom}</h3>
        <p>{form.marque} • {form.annee}</p>
        <p>{form.kilometrage} km • {form.energie} • {form.boite_vitesse}</p>
        <p>Couleur : {form.couleur}</p>
        <p className="text-blue-600 font-bold mt-2">{form.prix} €</p>
        <p className="mt-1 text-sm">{form.disponible ? '✅ Disponible' : '❌ Indisponible'}</p>
      </div>
    </main>
  );
}
