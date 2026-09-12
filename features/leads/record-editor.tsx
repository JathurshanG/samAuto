"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { statusLabel } from "@/lib/format";
export function RecordEditor({
  id,
  section,
  status,
  states,
  assignedTo,
  members,
}: {
  id: string;
  section: string;
  status: string;
  states: readonly string[];
  assignedTo?: string;
  members: { id: string; name: string }[];
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const f = new FormData(e.currentTarget);
          const r = await fetch("/api/admin/records", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id,
              section,
              status: f.get("status"),
              note: f.get("note") || "",
              assigned_to: f.get("assigned_to") || null,
            }),
          });
          if (!r.ok) throw Error("Modification refusée");
          setMessage("Enregistré.");
          router.refresh();
        } catch (e) {
          setMessage(e instanceof Error ? e.message : "Erreur");
        } finally {
          setBusy(false);
        }
      }}
      className="panel"
    >
      <div className="fields">
        <label>
          Statut
          <select name="status" defaultValue={status}>
            {states.map((s) => (
              <option value={s} key={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsable
          <select name="assigned_to" defaultValue={assignedTo || ""}>
            <option value="">Non attribué</option>
            {members.map((m) => (
              <option value={m.id} key={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {section === "leads" && (
        <label>
          Ajouter une note
          <textarea name="note" maxLength={4000} />
        </label>
      )}
      <div className="actions">
        <button disabled={busy}>Enregistrer le suivi</button>
      </div>
      <p role="status">{message}</p>
    </form>
  );
}
