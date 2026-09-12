import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/features/auth/session";
import { isSection, sections } from "@/features/leads/pipeline";
import { RecordEditor } from "@/features/leads/record-editor";
import { statusLabel } from "@/lib/format";
const labels: Record<string, string> = {
  kind: "Type",
  registration: "Immatriculation",
  make: "Marque",
  model: "Modèle",
  version: "Version",
  year: "Année",
  mileage: "Kilométrage",
  fuel: "Carburant",
  condition: "État",
  damages: "Dommages",
  maintenance: "Entretien",
  inspection: "Contrôle technique",
  owners: "Propriétaires",
  postal_code: "Code postal",
  desired_at: "Créneau souhaité (heure locale du garage)",
  service: "Intervention",
};
export default async function Page({
  params,
}: {
  params: Promise<{ section: string; id: string }>;
}) {
  const { section, id } = await params;
  if (!isSection(section)) notFound();
  const cfg = sections[section];
  const { client, user } = await requireStaff();
  const { data: r } = await client
    .from(cfg.table)
    .select("*")
    .eq("id", id)
    .single();
  if (!r) notFound();
  const { data: b } = await client
    .from("businesses")
    .select("name")
    .eq("id", r.business_id)
    .single();
  const { data: notes } =
    section === "leads"
      ? await client
          .from("lead_notes")
          .select("id,body,created_at")
          .eq("lead_id", id)
          .order("created_at", { ascending: false })
      : { data: [] };
  const { data: history } = await client
    .from("audit_logs")
    .select("id,action,old_status,new_status,created_at")
    .eq("record_id", id)
    .order("created_at", { ascending: false });
  const { data: photos } =
    section === "reprises"
      ? await client.from("trade_in_images").select("id").eq("request_id", id)
      : { data: [] };
  return (
    <>
      <Link href={`/admin/${section}`}>← {cfg.title}</Link>
      <h1>
        {r.first_name} {r.last_name}
      </h1>
      <p>
        Responsable du traitement : <strong>{b?.name}</strong>
      </p>
      <p>
        <a href={`tel:${r.phone}`}>{r.phone}</a> ·{" "}
        <a href={`mailto:${r.email}`}>{r.email}</a>
      </p>
      <p>
        Source : {r.source} · Reçue le{" "}
        {new Date(r.created_at).toLocaleString("fr-FR", {
          timeZone: "Europe/Paris",
        })}
      </p>
      {r.customer_id && (
        <Link href={`/admin/clients/${r.customer_id}`}>
          Ouvrir la fiche client
        </Link>
      )}
      <p style={{ whiteSpace: "pre-line" }}>{r.message}</p>
      <dl className="specs">
        {Object.entries(r.details as Record<string, unknown>)
          .filter(([key]) => labels[key])
          .map(([key, value]) => (
            <div key={key}>
              <dt>{labels[key]}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
      </dl>
      {photos?.map((photo, i) => (
        <p key={photo.id}>
          <a
            href={`/api/admin/trade-photo/${photo.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Photo privée {i + 1}
          </a>
        </p>
      ))}
      <RecordEditor
        id={id}
        section={section}
        status={r.status}
        states={cfg.states}
        assignedTo={r.assigned_to}
        members={[
          { id: user.id, name: "Moi" },
          ...(r.assigned_to && r.assigned_to !== user.id
            ? [{ id: r.assigned_to, name: "Responsable actuel" }]
            : []),
        ]}
      />
      {notes?.length ? (
        <>
          <h2>Notes</h2>
          {notes.map((n) => (
            <article key={n.id} className="panel">
              <small>{new Date(n.created_at).toLocaleString("fr-FR")}</small>
              <p style={{ whiteSpace: "pre-line" }}>{n.body}</p>
            </article>
          ))}
        </>
      ) : null}
      <h2>Historique</h2>
      <ul>
        {history?.map((h) => (
          <li key={h.id}>
            {new Date(h.created_at).toLocaleString("fr-FR")} · {h.action}{" "}
            {h.new_status && `— ${statusLabel[h.new_status] || h.new_status}`}
          </li>
        ))}
      </ul>
    </>
  );
}
