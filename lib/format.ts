export const money = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
export const number = (value: number) =>
  new Intl.NumberFormat("fr-FR").format(value);
export const statusLabel: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Réservé",
  SOLD: "Vendu",
  DRAFT: "Brouillon",
  ARCHIVED: "Archivé",
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  APPOINTMENT: "Rendez-vous",
  NEGOTIATION: "Négociation",
  WON: "Gagné",
  LOST: "Perdu",
  CONFIRMED: "Confirmé",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  PROPOSAL: "Proposition",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  CLOSED: "Clôturé",
};
