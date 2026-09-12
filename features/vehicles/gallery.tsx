"use client";
import Image from "next/image";
import { useRef, useState } from "react";
export function Gallery({
  images,
  title,
}: {
  images: { id: string; position: number }[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const list = [...images].sort((a, b) => a.position - b.position);
  if (!list.length) return <div className="empty">Photos non disponibles</div>;
  return (
    <div>
      <button
        className="vehicle-image"
        style={{ width: "100%", padding: 0, border: 0 }}
        onClick={() => dialog.current?.showModal()}
        aria-label="Ouvrir la galerie plein écran"
      >
        <Image
          src={`/api/images/${list[index].id}`}
          alt={`${title} — photo ${index + 1}`}
          fill
          sizes="(max-width:800px) 100vw, 65vw"
          priority
        />
      </button>
      <div className="actions">
        <button
          className="secondary"
          disabled={!index}
          onClick={() => setIndex(index - 1)}
        >
          Précédente
        </button>
        <span aria-live="polite">
          {index + 1} / {list.length}
        </span>
        <button
          className="secondary"
          disabled={index === list.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          Suivante
        </button>
      </div>
      <dialog
        ref={dialog}
        style={{ maxWidth: "95vw", width: 1100, border: 0, padding: 20 }}
      >
        <button onClick={() => dialog.current?.close()}>Fermer</button>
        <div style={{ position: "relative", height: "75vh" }}>
          <Image
            src={`/api/images/${list[index].id}`}
            alt={title}
            fill
            sizes="95vw"
            style={{ objectFit: "contain" }}
          />
        </div>
      </dialog>
    </div>
  );
}
