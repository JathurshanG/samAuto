import Link from "next/link";
import { nav } from "@/config/site";
import { business } from "@/services/public-data";
export async function Header() {
  const b = await business();
  return (
    <>
      <a className="skip" href="#contenu">
        Aller au contenu
      </a>
      <header>
        <div className="wrap header">
          <Link className="logo" href="/">
            {b?.name || (
              <>
                SAM<span>AUTO</span>
              </>
            )}
          </Link>
          <nav className="desktop-nav" aria-label="Navigation principale">
            {nav.map(([label, url]) => (
              <Link key={url} href={url}>
                {label}
              </Link>
            ))}
          </nav>
          <Link className="button" href="/rendez-vous">
            Prendre rendez-vous
          </Link>
        </div>
        <details className="mobile-nav wrap">
          <summary>Menu</summary>
          <nav aria-label="Navigation mobile">
            {nav.map(([label, url]) => (
              <Link key={url} href={url}>
                {label}
              </Link>
            ))}
          </nav>
        </details>
      </header>
      {b?.is_demo && (
        <div className="notice wrap">
          DÉMONSTRATION — données fictives, aucune offre commerciale réelle.
        </div>
      )}
    </>
  );
}
export async function Footer() {
  const b = await business();
  return (
    <footer>
      <div className="wrap footer-grid">
        <div>
          <strong>{b?.name || "SamAuto"}</strong>
          <p>{b?.address || "Adresse à renseigner par l’entreprise."}</p>
          {b?.phone && <a href={`tel:${b.phone}`}>{b.phone}</a>}
          <p style={{ whiteSpace: "pre-line" }}>{b?.hours}</p>
        </div>
        <div>
          <p>
            <Link href="/financement">Financement</Link>
          </p>
          <p>
            <Link href="/atelier">Atelier</Link>
          </p>
          <p>
            <Link href="/connexion">Espace professionnel</Link>
          </p>
        </div>
        <div>
          <p>
            <Link href="/mentions-legales">Mentions légales</Link>
          </p>
          <p>
            <Link href="/politique-confidentialite">Confidentialité</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
