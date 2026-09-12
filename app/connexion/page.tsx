import { login } from "@/features/auth/actions";
import { configured } from "@/config/site";
export const metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const p = await searchParams;
  return (
    <section className="wrap" style={{ maxWidth: 560 }}>
      <h1>Espace professionnel</h1>
      {!configured ? (
        <p className="notice">
          Connexion indisponible : configurez Supabase et l’entreprise
          conformément au README.
        </p>
      ) : (
        <form action={login} className="panel">
          <p>Accès réservé aux collaborateurs autorisés.</p>
          {p.erreur && (
            <p role="alert" className="error">
              Identifiants incorrects ou service indisponible.
            </p>
          )}
          {p.acces && (
            <p role="alert" className="error">
              Ce compte ne dispose d’aucune autorisation.
            </p>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
            />
          </label>
          <label>
            Mot de passe
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
            />
          </label>
          <div className="actions">
            <button>Se connecter</button>
          </div>
        </form>
      )}
    </section>
  );
}
