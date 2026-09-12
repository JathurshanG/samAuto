import { requireStaff } from "@/features/auth/session";
export default async function Page() {
  const { client } = await requireStaff();
  const { data, error } = await client.rpc("business_metrics");
  if (error) throw Error("Statistiques indisponibles");
  const metrics = data as {
    views: number;
    leads: number;
    workshop: number;
    top: { name: string; views: number; leads: number }[];
    sources: { source: string; count: number }[];
    aging: { name: string; days: number }[];
    retention_due: number;
  };
  return (
    <>
      <h1>Statistiques</h1>
      <p>
        30 derniers jours. La mesure d’audience dépend du consentement ; une vue
        n’est pas un visiteur unique. Les contacts téléphoniques non saisis dans
        le CRM ne sont pas comptés comme prospects.
      </p>
      <div className="grid">
        {[
          ["Vues consenties", metrics.views],
          ["Prospects reçus", metrics.leads],
          ["Demandes atelier", metrics.workshop],
        ].map(([l, n]) => (
          <div className="panel" key={l}>
            <p>{l}</p>
            <div className="metric">{n}</div>
          </div>
        ))}
      </div>
      <p>
        Ratio indicatif demandes / vues :{" "}
        {metrics.views
          ? `${Math.round((metrics.leads / metrics.views) * 100)} %`
          : "non calculable sans vues"}
        . Les deux populations diffèrent ; ce ratio peut dépasser 100 %.
      </p>
      <h2>Véhicules les plus vus</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Vues</th>
              <th>Prospects</th>
            </tr>
          </thead>
          <tbody>
            {metrics.top.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td>
                <td>{r.views}</td>
                <td>{r.leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Sources des prospects</h2>
      <ul>
        {metrics.sources.map((r) => (
          <li key={r.source}>
            {r.source} : {r.count}
          </li>
        ))}
      </ul>
      <h2>Stock publié depuis plus de 60 jours</h2>
      <ul>
        {metrics.aging.map((r, i) => (
          <li key={i}>
            {r.name} — {r.days} jours
          </li>
        ))}
      </ul>
      <h2>Revue de conservation</h2>
      <p>
        {metrics.retention_due} fiche(s) dépassent la durée cible configurée.
        Examinez les dossiers et leurs obligations de conservation avant
        effacement.
      </p>
    </>
  );
}
