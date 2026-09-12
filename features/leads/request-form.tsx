"use client";
import { useRef, useState } from "react";
import { compressPhotos } from "@/lib/compress-client";
export type Kind =
  "contact" | "finance" | "trade-in" | "appointment" | "workshop";
export function RequestForm({
  kind,
  listingId,
  services = [],
  recipient,
  enabled,
}: {
  kind: Kind;
  listingId?: string;
  services?: string[];
  recipient: string;
  enabled: boolean;
}) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const multi = kind === "trade-in";
  function next() {
    const box = form.current?.querySelector(`[data-step="${step}"]`);
    const invalid = box?.querySelector<HTMLInputElement>(
      "input:invalid,select:invalid,textarea:invalid",
    );
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    setStep(step + 1);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = new FormData(e.currentTarget);
      await compressPhotos(data);
      try {
        data.set(
          "analytics_consent",
          localStorage.getItem("samauto-analytics") === "yes" ? "yes" : "no",
        );
      } catch {
        data.set("analytics_consent", "no");
      }
      const files = data
        .getAll("photos")
        .filter((v): v is File => v instanceof File);
      if (files.reduce((n, f) => n + f.size, 0) > 3 * 1024 * 1024)
        throw Error(
          "Les photos doivent totaliser moins de 3 Mo. Réduisez leur taille avant l’envoi.",
        );
      const r = await fetch("/api/requests", { method: "POST", body: data });
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Envoi impossible");
      setSuccess(true);
      setMessage(
        kind === "trade-in"
          ? "Votre demande a bien été transmise. Nous reviendrons vers vous avec une proposition."
          : "Votre demande a bien été transmise. L’équipe vous recontactera ; aucun créneau n’est confirmé à ce stade.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Envoi impossible. Réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }
  function input(name: string, label: string, type = "text", required = false) {
    return (
      <label key={name}>
        {label}
        <input
          name={name}
          type={type}
          required={required}
          maxLength={type === "text" ? 200 : undefined}
          min={type === "number" ? 0 : undefined}
        />
      </label>
    );
  }
  const vehicle = (
    <div className="fields">
      {input("registration", "Immatriculation (facultative)")}
      {input("make", "Marque", "text", true)}
      {input("model", "Modèle", "text", true)}
      {input("version", "Version")}
      {input("year", "Année", "number", multi)}
      {input("mileage", "Kilométrage", "number", true)}
      {multi && input("fuel", "Carburant", "text", true)}
    </div>
  );
  const contact = (
    <div className="fields">
      {input("first_name", "Prénom", "text", true)}
      {input("last_name", "Nom", "text", true)}
      {input("phone", "Téléphone", "tel", true)}
      {input("email", "Email", "email", true)}
      {input("postal_code", "Code postal", "text", multi)}
    </div>
  );
  const consent = (
    <>
      <p>
        Destinataire de votre demande : <strong>{recipient}</strong>.
      </p>
      <label className="check">
        <input name="privacy" type="checkbox" required />
        <span>
          J’ai lu la{" "}
          <a href="/politique-confidentialite" target="_blank" rel="noreferrer">
            politique de confidentialité
          </a>{" "}
          et compris l’utilisation de mes coordonnées pour traiter cette
          demande.
        </span>
      </label>
      <label className="check">
        <input name="marketing" type="checkbox" />
        <span>
          Je souhaite aussi recevoir les offres commerciales de ce destinataire
          (facultatif).
        </span>
      </label>
    </>
  );
  if (success)
    return (
      <div className="panel success" role="status">
        {message}
      </div>
    );
  return (
    <form ref={form} onSubmit={submit} className="panel">
      {!enabled && (
        <p className="notice">
          Ce formulaire sera disponible après configuration de l’entreprise et
          du service.
        </p>
      )}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="listing_id" value={listingId || ""} />
      <div style={{ position: "absolute", left: -10000 }} aria-hidden="true">
        <label>
          Site web
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {multi ? (
        <>
          <p className="eyebrow">Étape {step + 1} sur 5</p>
          {[
            <>
              <h2>Votre véhicule</h2>
              {vehicle}
            </>,
            <>
              <h2>État et entretien</h2>
              <div className="fields">
                {input("condition", "État général", "text", true)}
                {input("damages", "Dommages connus")}
                {input("maintenance", "Entretien et justificatifs")}
                {input("inspection", "Contrôle technique")}
                {input("owners", "Nombre de propriétaires connu", "number")}
              </div>
            </>,
            <>
              <h2>Photos du véhicule</h2>
              <label>
                Jusqu’à 8 photos — JPEG, PNG ou WebP, 3 Mo au total
                <input
                  type="file"
                  name="photos"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                />
              </label>
              <p>
                Les photos sont privées et réservées au traitement de votre
                reprise.
              </p>
            </>,
            <>
              <h2>Vos coordonnées</h2>
              {contact}
            </>,
            <>
              <h2>Validation</h2>
              <label>
                Informations complémentaires
                <textarea name="message" maxLength={4000} />
              </label>
              {consent}
            </>,
          ].map((content, i) => (
            <fieldset
              data-step={i}
              key={i}
              hidden={step !== i}
              style={{ border: 0, padding: 0 }}
            >
              {content}
            </fieldset>
          ))}
          <div className="actions">
            {step > 0 && (
              <button
                type="button"
                className="secondary"
                onClick={() => setStep(step - 1)}
              >
                Retour
              </button>
            )}
            {step < 4 ? (
              <button type="button" onClick={next}>
                Continuer
              </button>
            ) : (
              <button disabled={busy || !enabled}>
                {busy ? "Envoi…" : "Envoyer ma demande"}
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          {kind === "workshop" && (
            <>
              <label>
                Intervention
                <select name="service" required>
                  <option value="">Choisir</option>
                  {services.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {vehicle}
            </>
          )}
          {["workshop", "appointment"].includes(kind) && (
            <label>
              Créneau souhaité (heure locale du garage)
              <input name="desired_at" type="datetime-local" required />
            </label>
          )}
          <h2>Vos coordonnées</h2>
          {contact}
          <label>
            Votre demande
            <textarea name="message" required maxLength={4000} />
          </label>
          {consent}
          <div className="actions">
            <button disabled={busy || !enabled}>
              {busy ? "Envoi…" : "Envoyer ma demande"}
            </button>
          </div>
        </>
      )}
      {message && (
        <p role="alert" className="error">
          {message}
        </p>
      )}
    </form>
  );
}
