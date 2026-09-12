import { business, operator } from "@/services/public-data";
export const metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
};
export default async function Page() {
  const b = await business();
  const o = await operator();
  return (
    <section className="wrap">
      <h1>Mentions légales</h1>
      {[b, o].filter(Boolean).map((entity, i) => (
        <article key={i}>
          <h2>{entity!.name}</h2>
          <p style={{ whiteSpace: "pre-line" }}>
            {entity!.legal_text ||
              "À COMPLÉTER ET FAIRE VALIDER PAR L’ENTREPRISE avant ouverture des formulaires."}
          </p>
        </article>
      ))}
      {!b && (
        <p className="notice">
          À COMPLÉTER : identité de l’éditeur, coordonnées, immatriculation,
          hébergeur, responsables de traitement, finalités, bases légales,
          destinataires, durées de conservation et exercice des droits. Ce texte
          ne constitue pas une politique juridique validée.
        </p>
      )}
    </section>
  );
}
