import { requireStaff } from "@/features/auth/session";
import { SettingsForm } from "@/features/settings/form";
import type { Business } from "@/types/domain";
export default async function Page() {
  const { client, members } = await requireStaff();
  const ids = members
    .filter((m) => m.role === "OWNER")
    .map((m) => m.business_id);
  if (!ids.length)
    return <p className="notice">Paramètres réservés aux propriétaires.</p>;
  const { data: businesses, error } = await client
    .from("businesses")
    .select("*")
    .in("id", ids);
  if (error) throw Error("Paramètres indisponibles");
  const { data: settings } = await client
    .from("business_settings")
    .select("*")
    .in("business_id", ids);
  return (
    <>
      <h1>Paramètres</h1>
      <p>
        Renseignez uniquement des informations réelles. La vente et l’atelier
        ont chacun leurs coordonnées et textes juridiques. Pour ajouter une
        entité ou attribuer des droits, utilisez la procédure sécurisée du
        README.
      </p>
      {businesses.map((b) => (
        <SettingsForm
          key={b.id}
          b={b as Business}
          settings={
            settings?.find((s) => s.business_id === b.id) || {
              retention_days: 1095,
              analytics_enabled: false,
            }
          }
          operators={businesses.filter((x) => x.kind === "WORKSHOP")}
        />
      ))}
    </>
  );
}
