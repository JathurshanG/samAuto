export const sections = {
  leads: {
    table: "leads",
    title: "Prospects",
    states: ["NEW", "CONTACTED", "APPOINTMENT", "NEGOTIATION", "WON", "LOST"],
  },
  reprises: {
    table: "trade_in_requests",
    title: "Demandes de reprise",
    states: ["NEW", "CONTACTED", "PROPOSAL", "ACCEPTED", "REJECTED", "CLOSED"],
  },
  "rendez-vous": {
    table: "appointments",
    title: "Rendez-vous",
    states: ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"],
  },
  atelier: {
    table: "workshop_requests",
    title: "Demandes atelier",
    states: [
      "NEW",
      "CONTACTED",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ],
  },
} as const;
export type Section = keyof typeof sections;
export function isSection(key: string): key is Section {
  return Object.hasOwn(sections, key);
}
