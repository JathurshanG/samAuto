import Link from "next/link";
import { notFound } from "next/navigation";
import { listing } from "@/features/vehicles/catalogue";
import { business } from "@/services/public-data";
import { Gallery } from "@/features/vehicles/gallery";
import { RequestForm } from "@/features/leads/request-form";
import { money, number, statusLabel } from "@/lib/format";
import { safeJson, canEnquire } from "@/lib/validation";
import { siteUrl } from "@/config/site";
import {
  Favorite,
  ViewEvent,
  ContactLink,
} from "@/features/analytics/tracking";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const l = await listing(slug);
  if (!l) return { title: "Véhicule introuvable" };
  const title = `${l.vehicles.make} ${l.vehicles.model} ${l.vehicles.year}`;
  return {
    title,
    description: `${title} — ${number(l.vehicles.mileage)} km — ${money(l.price)}`,
    alternates: { canonical: `/vehicules/${slug}` },
    openGraph: { title, url: `/vehicules/${slug}` },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const l = await listing(slug);
  if (!l) notFound();
  const v = l.vehicles;
  const b = await business();
  const available = canEnquire(l.status);
  const title = `${v.make} ${v.model}`;
  const structured = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${title} ${v.version}`,
    brand: { "@type": "Brand", name: v.make },
    model: v.model,
    vehicleModelDate: String(v.year),
    fuelType: v.fuel,
    vehicleTransmission: v.transmission,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: v.mileage,
      unitCode: "KMT",
    },
    offers: {
      "@type": "Offer",
      price: l.price,
      priceCurrency: "EUR",
      availability:
        l.status === "AVAILABLE"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${siteUrl}/vehicules/${l.slug}`,
    },
  };
  return (
    <section className="wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJson(structured) }}
      />
      <ViewEvent id={l.id} />
      <p>
        <Link href="/vehicules">← Retour au catalogue</Link>
      </p>
      <div className="split">
        <div>
          <Gallery images={v.vehicle_images} title={title} />
          <h2>Informations essentielles</h2>
          <dl className="specs">
            {[
              ["Année", v.year],
              ["Kilométrage", `${number(v.mileage)} km`],
              ["Carburant", v.fuel],
              ["Boîte", v.transmission],
              ["Première circulation", v.first_registration],
              ["Puissance (ch)", v.power],
              ["Puissance fiscale", v.fiscal_power],
              ["Carrosserie", v.body],
              ["Couleur", v.color],
              ["Portes", v.doors],
              ["Places", v.seats],
            ]
              .filter(([, value]) => value !== null && value !== "")
              .map(([label, value]) => (
                <div key={String(label)}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <h2>Description</h2>
          <p style={{ whiteSpace: "pre-line" }}>
            {v.description || "Contactez l’équipe pour en savoir plus."}
          </p>
          {v.equipment.length > 0 && (
            <>
              <h2>Équipements</h2>
              <ul>
                {v.equipment.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <aside>
          <span className="badge">{statusLabel[l.status]}</span>
          <h1>{title}</h1>
          <p>{v.version}</p>
          <p className="price">{money(l.price)}</p>
          {l.warranty && <p>Garantie : {l.warranty}</p>}
          <Favorite id={l.id} />
          {available ? (
            <>
              <div className="sticky-actions">
                <div className="actions">
                  {b?.phone && (
                    <ContactLink
                      href={`tel:${b.phone}`}
                      event="PHONE_CLICK"
                      id={l.id}
                    >
                      Appeler
                    </ContactLink>
                  )}
                  {b?.whatsapp && (
                    <ContactLink
                      href={`https://wa.me/${b.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour, je souhaite des informations sur ${title} : ${siteUrl}/vehicules/${l.slug}`)}`}
                      event="WHATSAPP_CLICK"
                      id={l.id}
                    >
                      WhatsApp
                    </ContactLink>
                  )}
                </div>
              </div>
              <p>
                <Link href={`/rendez-vous?vehicule=${l.id}`}>
                  Demander un rendez-vous
                </Link>
              </p>
              <p>
                <Link href="/reprise">Demander une reprise</Link>
              </p>
              <p>
                <Link href={`/financement?vehicule=${l.id}`}>
                  Demander un financement
                </Link>
              </p>
              <h2>Demander des informations</h2>
              <RequestForm
                kind="contact"
                listingId={l.id}
                recipient={b?.name || "Entreprise à configurer"}
                enabled={Boolean(b?.legal_text && b?.privacy_text)}
              />
            </>
          ) : (
            <p className="notice">
              Ce véhicule est {statusLabel[l.status].toLowerCase()}. Les
              demandes d’achat sont fermées.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
