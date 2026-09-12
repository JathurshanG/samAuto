import Link from "next/link";
import { catalogue } from "@/features/vehicles/catalogue";
import { VehicleCard } from "@/components/vehicle-card";
export const metadata = {
  title: "Véhicules d’occasion",
  alternates: { canonical: "/vehicules" },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const p = await searchParams;
  const { items, count, page } = await catalogue(p);
  function href(n: number) {
    const q = new URLSearchParams(p);
    q.set("page", String(n));
    return `/vehicules?${q}`;
  }
  return (
    <section className="wrap">
      <p className="eyebrow">Le stock automobile</p>
      <h1>Trouvez votre véhicule.</h1>
      <form className="panel">
        <div className="fields">
          {[
            ["make", "Marque"],
            ["model", "Modèle"],
            ["max_price", "Budget maximum (€)"],
            ["max_mileage", "Kilométrage maximum"],
          ].map(([k, l]) => (
            <label key={k}>
              {l}
              <input
                name={k}
                defaultValue={p[k]}
                type={k.startsWith("max_") ? "number" : "text"}
                min="0"
              />
            </label>
          ))}
        </div>
        <details>
          <summary>Plus de filtres</summary>
          <div className="fields">
            {[
              ["min_price", "Prix minimum"],
              ["min_year", "Année minimum"],
              ["max_year", "Année maximum"],
              ["power", "Puissance minimum (ch)"],
              ["doors", "Portes"],
            ].map(([k, l]) => (
              <label key={k}>
                {l}
                <input name={k} type="number" min="0" defaultValue={p[k]} />
              </label>
            ))}
            {[
              [
                "fuel",
                "Carburant",
                [
                  "Essence",
                  "Diesel",
                  "Hybride",
                  "Hybride rechargeable",
                  "Électrique",
                  "GPL",
                  "Autre",
                ],
              ],
              ["transmission", "Boîte", ["Manuelle", "Automatique"]],
            ].map(([k, l, opts]) => (
              <label key={k as string}>
                {l}
                <select name={k as string} defaultValue={p[k as string]}>
                  <option value="">Tous</option>
                  {(opts as string[]).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Carrosserie
              <input name="body" defaultValue={p.body} />
            </label>
            <label>
              Couleur
              <input name="color" defaultValue={p.color} />
            </label>
          </div>
        </details>
        <div className="actions">
          <label>
            Trier
            <select name="sort" defaultValue={p.sort}>
              <option value="new">Nouveautés</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="mileage">Kilométrage</option>
              <option value="year">Année</option>
            </select>
          </label>
          <button>Rechercher</button>
          <Link className="button secondary" href="/vehicules">
            Réinitialiser
          </Link>
        </div>
      </form>
      <p>{count} véhicule(s)</p>
      {items.length ? (
        <div className="grid">
          {items.map((item) => (
            <VehicleCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="empty">
          Aucun véhicule ne correspond à votre recherche.
          <p>
            <Link href="/contact">
              Contactez-nous pour préciser votre recherche.
            </Link>
          </p>
        </div>
      )}
      <div className="actions" aria-label="Pagination">
        {page > 1 && (
          <Link className="button secondary" href={href(page - 1)}>
            Précédent
          </Link>
        )}
        {page * 12 < count && (
          <Link className="button secondary" href={href(page + 1)}>
            Suivant
          </Link>
        )}
      </div>
    </section>
  );
}
