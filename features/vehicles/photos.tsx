"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { compressPhotos } from "@/lib/compress-client";
export function PhotoManager({
  vehicleId,
  images,
}: {
  vehicleId: string;
  images: { id: string; position: number }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  async function send(
    body:
      | FormData
      | { id: string; action: string }
      | { action: "REORDER"; vehicle_id: string; ids: string[] },
  ) {
    setBusy(true);
    try {
      const form = body instanceof FormData;
      if (form) await compressPhotos(body);
      const r = await fetch("/api/admin/photos", {
        method: form ? "POST" : "PATCH",
        headers: form ? undefined : { "Content-Type": "application/json" },
        body: form ? body : JSON.stringify(body),
      });
      if (!r.ok)
        throw Error(
          "Échec de l’opération. Formats JPEG/PNG/WebP, 8 Mo par photo, 3 Mo par envoi.",
        );
      setMessage("Photos enregistrées.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= images.length || from === to) return;
    const ordered = images.map((i) => i.id);
    const [item] = ordered.splice(from, 1);
    ordered.splice(to, 0, item);
    send({ action: "REORDER", vehicle_id: vehicleId, ids: ordered });
  }
  return (
    <section>
      <h2>Photos</h2>
      <p>
        La première photo est la photo principale. Les originaux sont réencodés
        en WebP, sans métadonnées EXIF.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(new FormData(e.currentTarget));
        }}
      >
        <input type="hidden" name="vehicle_id" value={vehicleId} />
        <label>
          Photos JPEG, PNG ou WebP
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
          />
        </label>
        <button disabled={busy}>Ajouter les photos</button>
      </form>
      <ol>
        {images.map((im, i) => (
          <li
            key={im.id}
            draggable={!busy}
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null) move(dragIndex, i);
              setDragIndex(null);
            }}
          >
            <a href={`/api/images/${im.id}`} target="_blank" rel="noreferrer">
              Photo {i + 1}
            </a>{" "}
            <button
              type="button"
              className="secondary"
              disabled={busy || i === 0}
              onClick={() => move(i, i - 1)}
              aria-label={`Monter la photo ${i + 1}`}
            >
              Monter
            </button>{" "}
            <button
              type="button"
              className="secondary"
              disabled={busy || i === images.length - 1}
              onClick={() => move(i, i + 1)}
              aria-label={`Descendre la photo ${i + 1}`}
            >
              Descendre
            </button>{" "}
            <button
              className="secondary"
              disabled={busy || i === 0}
              onClick={() => send({ id: im.id, action: "FIRST" })}
            >
              Définir principale
            </button>{" "}
            <button
              className="secondary"
              disabled={busy}
              onClick={() => {
                if (confirm("Supprimer cette photo ?"))
                  send({ id: im.id, action: "DELETE" });
              }}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ol>
      <p role="status">{message}</p>
    </section>
  );
}
