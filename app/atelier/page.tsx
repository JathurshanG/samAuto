import { operator } from "@/services/public-data";
import { RequestForm } from "@/features/leads/request-form";
export const metadata = {
  title: "Atelier automobile",
  alternates: { canonical: "/atelier" },
};
export default async function Page() {
  const b = await operator();
  return (
    <section className="wrap">
      <p className="eyebrow">Entretien & réparation</p>
      <h1>L’atelier automobile.</h1>
      {b ? (
        <>
          <p>
            Activité exploitée par <strong>{b.name}</strong>. Cette entité
            reçoit et traite vos demandes de réparation.
          </p>
          <p>
            {b.address} {b.phone && <a href={`tel:${b.phone}`}>{b.phone}</a>}
          </p>
          <div className="actions">
            {b.services.map((s) => (
              <span className="badge" key={s}>
                {s}
              </span>
            ))}
          </div>
          {b.services.length > 0 ? (
            <div style={{ maxWidth: 850 }}>
              <h2>Demander un rendez-vous</h2>
              <p>
                Le créneau souhaité sera confirmé après examen de la demande.
              </p>
              <RequestForm
                kind="workshop"
                services={b.services}
                recipient={b.name}
                enabled={Boolean(b.privacy_text && b.legal_text)}
              />
            </div>
          ) : (
            <div className="empty">
              Aucun service atelier n’est actuellement publié.
            </div>
          )}
        </>
      ) : (
        <div className="empty">
          Les coordonnées et services de l’opérateur de l’atelier ne sont pas
          encore renseignés. La prise de rendez-vous atelier est indisponible.
        </div>
      )}
    </section>
  );
}
