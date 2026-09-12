"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <section className="wrap">
      <h1>Service momentanément indisponible</h1>
      <p role="alert">
        Impossible de charger cette page. Votre demande n’a pas été confirmée.
      </p>
      <button onClick={reset}>Réessayer</button>
    </section>
  );
}
