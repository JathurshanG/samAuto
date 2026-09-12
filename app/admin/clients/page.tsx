import Link from "next/link";
import { requireStaff } from "@/features/auth/session";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const p = await searchParams;
  const { client } = await requireStaff();
  const term = (p.q || "").slice(0, 80);
  const { data, error } = await client.rpc("search_customers", {
    p_query: term,
  });
  if (error) throw Error("Clients indisponibles");
  return (
    <>
      <h1>Clients</h1>
      <form className="actions">
        <label>
          Nom, email, téléphone ou immatriculation
          <input name="q" defaultValue={term} />
        </label>
        <button>Rechercher</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Téléphone</th>
            </tr>
          </thead>
          <tbody>
            {(
              data as {
                id: string;
                first_name: string;
                last_name: string;
                email: string;
                phone: string;
              }[]
            ).map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/clients/${c.id}`}>
                    {c.first_name} {c.last_name}
                  </Link>
                </td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.length && <div className="empty">Aucun client.</div>}
      <p className="muted">
        Les 100 premiers résultats sont affichés. Affinez la recherche si
        nécessaire.
      </p>
    </>
  );
}
