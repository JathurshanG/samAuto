import { RequestForm } from "@/features/leads/request-form";
import { business } from "@/services/public-data";
export const metadata = {
  title: "Parlons de votre projet.",
  alternates: { canonical: "/contact" },
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
      <h1>Parlons de votre projet.</h1>
      <p>
        Une question sur un véhicule ou votre recherche ? Écrivez à l’équipe.
      </p>
      <RequestForm
        kind="contact"
        listingId={params.vehicule}
        recipient={b?.name || "Entreprise à configurer"}
        enabled={Boolean(b?.legal_text && b?.privacy_text)}
      />
    </section>
  );
}
