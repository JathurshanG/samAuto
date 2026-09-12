import Link from "next/link";
export default function Page() {
  return (
    <section className="wrap">
      <h1>Page introuvable</h1>
      <Link className="button" href="/vehicules">
        Voir le catalogue
      </Link>
    </section>
  );
}
