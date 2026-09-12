import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/features/auth/session";
import { isSection, sections } from "@/features/leads/pipeline";
import { statusLabel } from "@/lib/format";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  const config = sections[section];
  const { client } = await requireStaff();
  const p = await searchParams;
  const page = Math.max(1, Math.floor(Number(p.page) || 1));
  let q = client
    .from(config.table)
    .select(
      "id,first_name,last_name,email,phone,status,created_at,businesses(name)",
      { count: "exact" },
    );
  if (p.status) q = q.eq("status", p.status);
  const term = (p.q || "").replace(/[^\p{L}\p{N}@ -]/gu, "").slice(0, 80);
  if (term)
    q = q.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range((page - 1) * 30, page * 30 - 1);
  if (error) throw Error("Demandes indisponibles");
  return (
    <>
      <h1>{config.title}</h1>
      <form className="actions">
        <label>
          Rechercher
          <input name="q" defaultValue={p.q} />
        </label>
        <label>
          Statut
          <select name="status" defaultValue={p.status}>
            <option value="">Tous</option>
            {config.states.map((s) => (
              <option value={s} key={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </label>
        <button>Filtrer</button>
      </form>
      <p>{count || 0} demande(s)</p>
      {data.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contact</th>
                <th>Entité responsable</th>
                <th>Statut</th>
                <th>Reçue le</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.first_name} {r.last_name}
                    <br />
                    {r.phone}
                  </td>
                  <td>{(r.businesses as unknown as { name: string })?.name}</td>
                  <td>{statusLabel[r.status]}</td>
                  <td>{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <Link href={`/admin/${section}/${r.id}`}>Ouvrir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">Aucune demande pour ces critères.</div>
      )}
      <div className="actions">
        {page > 1 && (
          <Link
            href={`?${new URLSearchParams({ ...p, page: String(page - 1) })}`}
          >
            Précédent
          </Link>
        )}
        {page * 30 < (count || 0) && (
          <Link
            href={`?${new URLSearchParams({ ...p, page: String(page + 1) })}`}
          >
            Suivant
          </Link>
        )}
      </div>
    </>
  );
}
