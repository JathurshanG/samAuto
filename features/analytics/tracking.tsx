"use client";
import { useEffect } from "react";
import { useLocalValue } from "@/hooks/use-local-value";
export function track(event: string, listingId?: string) {
  if (localStorage.getItem("samauto-analytics") !== "yes") return;
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, listing_id: listingId }),
    keepalive: true,
  }).catch(() => {});
}
export function Consent() {
  const [choice, setChoice] = useLocalValue("samauto-analytics");
  function choose(value: string) {
    localStorage.setItem("samauto-analytics", value);
    setChoice(value);
  }
  if (choice === "pending") return null;
  return (
    <div className="wrap">
      {choice === null ? (
        <div className="panel">
          <p>
            Autorisez-vous la mesure d’audience facultative, sans nom ni
            coordonnées ? Votre choix peut être modifié ici à tout moment.
          </p>
          <div className="actions">
            <button className="secondary" onClick={() => choose("no")}>
              Refuser
            </button>
            <button onClick={() => choose("yes")}>Accepter</button>
          </div>
        </div>
      ) : (
        <button
          className="secondary"
          onClick={() => {
            localStorage.removeItem("samauto-analytics");
            setChoice(null);
          }}
        >
          Préférences de mesure d’audience
        </button>
      )}
    </div>
  );
}
export function ViewEvent({ id }: { id: string }) {
  useEffect(() => {
    track("VEHICLE_VIEW", id);
  }, [id]);
  return null;
}
export function ContactLink({
  href,
  event,
  id,
  children,
}: {
  href: string;
  event: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <a className="button" href={href} onClick={() => track(event, id)}>
      {children}
    </a>
  );
}
export function Favorite({ id }: { id: string }) {
  const [value, setValue] = useLocalValue(`favorite-${id}`);
  const saved = value === "yes";
  return (
    <button
      className="secondary"
      aria-pressed={saved}
      onClick={() => {
        const next = !saved;
        setValue(next ? "yes" : null);
        if (next) {
          localStorage.setItem(`favorite-${id}`, "yes");
          track("FAVORITE", id);
        } else localStorage.removeItem(`favorite-${id}`);
      }}
    >
      {saved ? "Retirer des favoris" : "Garder en favori"}
    </button>
  );
}
