"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function Anonymize({ id }: { id: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  return (
    <div className="panel">
      <h2>Effacement des données de contact</h2>
      <p>
        Vérifiez l’identité du demandeur et les obligations de conservation
        applicables avant de poursuivre. Les notes, photos de reprise et
        informations des demandes seront supprimées ; les compteurs et statuts
        seront conservés.
      </p>
      <button
        className="secondary"
        onClick={async () => {
          if (
            prompt("Action irréversible. Tapez EFFACER pour confirmer.") !==
            "EFFACER"
          )
            return;
          const r = await fetch("/api/admin/customers", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, confirmation: "EFFACER" }),
          });
          setMessage(
            r.ok
              ? "Données effacées."
              : "Effacement refusé ou incomplet. Réessayez.",
          );
          router.refresh();
        }}
      >
        Effacer les données personnelles
      </button>
      <p role="status">{message}</p>
    </div>
  );
}
