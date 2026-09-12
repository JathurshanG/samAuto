"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { statusLabel } from "@/lib/format";
type Values = Record<string, string | number | null | undefined>;
export function VehicleEditor({
  initial = {},
  id,
  businesses,
}: {
  initial?: Values;
  id?: string;
  businesses: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin/vehicles", {
        method: "POST",
        body: new FormData(e.currentTarget),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      router.push(`/admin/vehicules/${data.id}`);
      router.refresh();
      setMessage("Véhicule enregistré.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Échec de l’enregistrement");
    } finally {
      setBusy(false);
    }
  }
  function field(k: string, l: string, type = "text", required = false) {
    return (
      <label key={k}>
        {l}
        <input
          name={k}
          type={type}
          required={required}
          defaultValue={initial[k] ?? ""}
          min={type === "number" ? 0 : undefined}
        />
      </label>
    );
  }
  return (
    <form onSubmit={save} className="panel">
      <input type="hidden" name="id" value={id || ""} />
      <label>
        Entreprise
        <select
          name="business_id"
          defaultValue={initial.business_id || businesses[0]?.id}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <h2>Véhicule</h2>
      <div className="fields">
        {field("make", "Marque", "text", true)}
        {field("model", "Modèle", "text", true)}
        {field("version", "Version")}
        {field("year", "Année", "number", true)}
        {field("first_registration", "Première mise en circulation", "date")}
        {field("mileage", "Kilométrage", "number", true)}
        <label>
          Carburant
          <select name="fuel" defaultValue={initial.fuel || "Essence"}>
            {[
              "Essence",
              "Diesel",
              "Hybride",
              "Hybride rechargeable",
              "Électrique",
              "GPL",
              "Autre",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Boîte
          <select
            name="transmission"
            defaultValue={initial.transmission || "Manuelle"}
          >
            <option>Manuelle</option>
            <option>Automatique</option>
          </select>
        </label>
        {[
          ["body", "Carrosserie"],
          ["color", "Couleur"],
        ].map(([k, l]) => field(k, l))}
        {[
          ["power", "Puissance (ch)"],
          ["fiscal_power", "Puissance fiscale"],
          ["engine_cc", "Cylindrée"],
          ["doors", "Portes"],
          ["seats", "Places"],
        ].map(([k, l]) => field(k, l, "number"))}
      </div>
      <h2>Commerce</h2>
      <div className="fields">
        {field("price", "Prix de vente (€)", "number", true)}
        {field("warranty", "Garantie réellement proposée")}
      </div>
      <h2>Informations internes — privées</h2>
      <div className="fields">
        {[
          ["vin", "VIN"],
          ["registration", "Immatriculation"],
          ["internal_reference", "Référence interne"],
        ].map(([k, l]) => field(k, l))}
        {field("purchase_price", "Prix d’achat (€)", "number")}
        {field("internal_costs", "Frais internes (€)", "number")}
      </div>
      <h2>Présentation</h2>
      <label>
        Description
        <textarea name="description" defaultValue={initial.description || ""} />
      </label>
      <label>
        Équipements — un par ligne
        <textarea name="equipment" defaultValue={initial.equipment || ""} />
      </label>
      <p className="muted">
        L’enregistrement conserve le statut actuel. Un nouveau véhicule est créé
        en brouillon ; ajoutez ses photos avant publication.
      </p>
      <div className="actions">
        <button disabled={busy}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      <p role="status">{message}</p>
    </form>
  );
}
export function ListingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function change(action: string) {
    if (
      action === "DELETE" &&
      !window.confirm("Supprimer définitivement ce brouillon et ses données ?")
    )
      return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (action === "DELETE") router.push("/admin/vehicules");
      else if (d.id) router.push(`/admin/vehicules/${d.id}`);
      router.refresh();
      setMessage("Modification enregistrée.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p>
        Statut : <strong>{statusLabel[status]}</strong>
      </p>
      <div className="actions">
        {[
          "DRAFT",
          "AVAILABLE",
          "RESERVED",
          "SOLD",
          "ARCHIVED",
          "DUPLICATE",
          "DELETE",
        ].map((s) => (
          <button
            type="button"
            className="secondary"
            key={s}
            disabled={busy || s === status}
            onClick={() => change(s)}
          >
            {s === "DELETE"
              ? "Supprimer"
              : s === "DUPLICATE"
                ? "Dupliquer"
                : statusLabel[s]}
          </button>
        ))}
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
