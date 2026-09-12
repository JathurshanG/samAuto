import { business } from "@/services/public-data";
export const metadata = {
  title: "À propos",
  alternates: { canonical: "/a-propos" },
};
export default async function Page() {
  const b = await business();
  return (
    <section className="wrap">
      <h1>{b?.name || "Notre entreprise"}</h1>
      <p>
        Achat, vente et reprise de véhicules d’occasion. Retrouvez les annonces
        publiées et contactez directement l’équipe pour votre projet.
      </p>
      {b?.benefits.length ? b.benefits.map((x) => <p key={x}>{x}</p>) : null}
      <h2>Nous trouver</h2>
      <p>{b?.address || "Adresse à renseigner."}</p>
      {b?.address && (
        <a
          className="button secondary"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
          target="_blank"
          rel="noreferrer"
        >
          Ouvrir la carte
        </a>
      )}
      <p style={{ whiteSpace: "pre-line" }}>{b?.hours}</p>
    </section>
  );
}
