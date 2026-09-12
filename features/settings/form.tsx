"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Business } from "@/types/domain";
export function SettingsForm({
  b,
  settings,
  operators,
}: {
  b: Business;
  settings: { retention_days: number; analytics_enabled: boolean };
  operators: { id: string; name: string }[];
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await fetch("/api/admin/settings", {
            method: "POST",
            body: new FormData(e.currentTarget),
          });
          if (!r.ok)
            throw Error(
              "Enregistrement refusé. Vérifiez les champs et vos droits propriétaire.",
            );
          setMessage("Paramètres enregistrés.");
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Erreur");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input type="hidden" name="id" value={b.id} />
      <h2>
        {b.kind === "SALES" ? "Entreprise de vente" : "Opérateur atelier"}
      </h2>
      <div className="fields">
        {(
          [
            ["name", "Nom commercial"],
            ["phone", "Téléphone"],
            ["whatsapp", "WhatsApp — indicatif international"],
            ["email", "Email"],
            ["address", "Adresse"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              defaultValue={b[key] || ""}
              required={key === "name"}
            />
          </label>
        ))}
        <label>
          Horaires
          <textarea name="hours" defaultValue={b.hours || ""} />
        </label>
      </div>
      <label>
        Arguments commerciaux vérifiables — un par ligne
        <textarea name="benefits" defaultValue={b.benefits.join("\n")} />
      </label>
      <label>
        Services atelier activés — un par ligne
        <textarea name="services" defaultValue={b.services.join("\n")} />
      </label>
      {b.kind === "SALES" && (
        <label>
          Opérateur responsable de l’atelier
          <select
            name="workshop_operator_id"
            defaultValue={b.workshop_operator_id || ""}
          >
            <option value="">Atelier non configuré</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Mentions légales — texte validé de cette entité
        <textarea name="legal_text" defaultValue={b.legal_text || ""} />
      </label>
      <label>
        Politique de confidentialité — texte validé de cette entité
        <textarea name="privacy_text" defaultValue={b.privacy_text || ""} />
      </label>
      <label>
        Durée de conservation cible des prospects (jours)
        <input
          type="number"
          name="retention_days"
          min={30}
          max={3650}
          defaultValue={settings.retention_days}
        />
      </label>
      <p>
        Cette durée alimente la revue des données à effacer. Aucun effacement
        automatique des dossiers commerciaux n’est déclenché.
      </p>
      <label className="check">
        <input
          type="checkbox"
          name="analytics_enabled"
          defaultChecked={settings.analytics_enabled}
        />
        Activer la mesure d’audience facultative
      </label>
      <div className="actions">
        <button disabled={busy}>Enregistrer les paramètres</button>
      </div>
      <p role="status">{message}</p>
    </form>
  );
}
