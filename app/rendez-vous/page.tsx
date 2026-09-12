import { RequestForm } from "@/features/leads/request-form";
import { business } from "@/services/public-data";
export const metadata = {
  title: "Rencontrons-nous.",
  alternates: { canonical: "/rendez-vous" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const b = await business();
  const params = await searchParams;
  return (
    <section className="wrap" style={{ maxWidth: 900 }}>
      <h1>Rencontrons-nous.</h1>
      <p>
        Demandez un rendez-vous commercial. Le créneau reste soumis à
        confirmation humaine.
      </p>
      <RequestForm
        kind="appointment"
        listingId={params.vehicule}
        recipient={b?.name || "Entreprise à configurer"}
        enabled={Boolean(b?.legal_text && b?.privacy_text)}
      />
    </section>
  );
}
