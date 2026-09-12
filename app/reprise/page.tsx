import { RequestForm } from "@/features/leads/request-form";
import { business } from "@/services/public-data";
export const metadata = {
  title: "Faites reprendre votre véhicule.",
  alternates: { canonical: "/reprise" },
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
      <h1>Faites reprendre votre véhicule.</h1>
      <p>
        Présentez-nous votre véhicule. L’équipe étudiera votre demande, sans
        estimation automatique.
      </p>
      <RequestForm
        kind="trade-in"
        listingId={params.vehicule}
        recipient={b?.name || "Entreprise à configurer"}
        enabled={Boolean(b?.legal_text && b?.privacy_text)}
      />
    </section>
  );
}
