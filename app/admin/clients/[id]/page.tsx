import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/features/auth/session";
import { sections } from "@/features/leads/pipeline";
import { Anonymize } from "@/features/customers/anonymize";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, members } = await requireStaff();
  const { data: c } = await client
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  if (!c) notFound();
  const records = await Promise.all(
    Object.entries(sections).map(async ([key, cfg]) => {
      const { data, error } = await client
        .from(cfg.table)
        .select("id,status,created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false });
      if (error) throw Error("Historique indisponible");
      return { key, title: cfg.title, data };
    }),
  );
  const { data: vehicles } = await client
    .from("customer_vehicles")
    .select("id,registration,make,model")
    .eq("customer_id", id);
  return (
    <>
      <h1>
        {c.first_name} {c.last_name}
      </h1>
      <p>
        {c.email} · {c.phone} · {c.postal_code}
      </p>
      <p>
        Offres commerciales :{" "}
        {c.marketing_consent ? "consentement recueilli" : "non autorisées"}
      </p>
      <h2>Véhicules du client</h2>
      {vehicles?.length ? (
        <ul>
          {vehicles.map((v) => (
            <li key={v.id}>
              {v.make} {v.model} {v.registration}
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun véhicule rattaché.</p>
      )}
      {records.map((g) => (
        <section key={g.key}>
          <h2>{g.title}</h2>
          {g.data.length ? (
            <ul>
              {g.data.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/${g.key}/${r.id}`}>
                    {new Date(r.created_at).toLocaleDateString("fr-FR")} —{" "}
                    {r.status}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>Aucune demande.</p>
          )}
        </section>
      ))}
      {members.some(
        (m) => m.business_id === c.business_id && m.role === "OWNER",
      ) && <Anonymize id={id} />}
    </>
  );
}
