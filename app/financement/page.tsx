import { RequestForm } from "@/features/leads/request-form";
import { business } from "@/services/public-data";
export const metadata = {
  title: "Votre projet de financement.",
  alternates: { canonical: "/financement" },
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
      <h1>Votre projet de financement.</h1>
      <p>
        Décrivez votre besoin. Aucune offre, mensualité ni acceptation de crédit
        n’est proposée automatiquement.
      </p>
      <RequestForm
        kind="finance"
        listingId={params.vehicule}
        recipient={b?.name || "Entreprise à configurer"}
        enabled={Boolean(b?.legal_text && b?.privacy_text)}
      />
    </section>
  );
}
