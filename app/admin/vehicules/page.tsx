import Link from "next/link";
import { requireStaff } from "@/features/auth/session";
import { money, statusLabel } from "@/lib/format";
export default async function Page() {
  const { client, members } = await requireStaff();
  const { data, error } = await client
    .from("vehicle_listings")
    .select("id,status,price,vehicles(make,model)")
    .in(
      "business_id",
      members.map((m) => m.business_id),
    )
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) throw Error("Stock indisponible");
  return (
    <>
      <h1>Stock automobile</h1>
      <div className="actions">
        <Link className="button" href="/admin/vehicules/nouveau">
          Ajouter un véhicule
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Prix</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((l) => {
              const v = l.vehicles as unknown as {
                make: string;
                model: string;
              };
              return (
                <tr key={l.id}>
                  <td>
                    {v?.make} {v?.model}
                  </td>
                  <td>{money(l.price)}</td>
                  <td>{statusLabel[l.status]}</td>
                  <td>
                    <Link href={`/admin/vehicules/${l.id}`}>Gérer</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!data.length && (
        <div className="empty">
          Aucun véhicule. Ajoutez votre premier véhicule.
        </div>
      )}
    </>
  );
}
