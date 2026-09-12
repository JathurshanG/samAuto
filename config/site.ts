export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.SALES_BUSINESS_ID,
);
export const nav = [
  ["Véhicules", "/vehicules"],
  ["Reprise", "/reprise"],
  ["Atelier", "/atelier"],
  ["À propos", "/a-propos"],
  ["Contact", "/contact"],
];
export const adminNav = [
  ["Dashboard", "/admin"],
  ["Stock", "/admin/vehicules"],
  ["Prospects", "/admin/leads"],
  ["Clients", "/admin/clients"],
  ["Reprises", "/admin/reprises"],
  ["Rendez-vous", "/admin/rendez-vous"],
  ["Atelier", "/admin/atelier"],
  ["Statistiques", "/admin/statistiques"],
  ["Paramètres", "/admin/parametres"],
];
