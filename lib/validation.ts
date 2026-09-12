import { z } from "zod";
const text = z.string().trim().max(200);
export const optionalNumber = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().int().min(0).max(10000000).nullable(),
);
export const vehicleSchema = z.object({
  make: text.min(1),
  model: text.min(1),
  version: text.default(""),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().int().min(0).max(3000000),
  fuel: z.enum([
    "Essence",
    "Diesel",
    "Hybride",
    "Hybride rechargeable",
    "Électrique",
    "GPL",
    "Autre",
  ]),
  transmission: z.enum(["Manuelle", "Automatique"]),
  body: text.default(""),
  color: text.default(""),
  power: optionalNumber,
  fiscal_power: optionalNumber,
  engine_cc: optionalNumber,
  doors: optionalNumber,
  seats: optionalNumber,
  first_registration: z
    .union([z.iso.date(), z.literal("")])
    .transform((v) => v || null),
  description: z.string().trim().max(10000),
  equipment: z
    .string()
    .max(6000)
    .transform((v) =>
      v
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  price: z.coerce.number().positive().max(10000000),
  warranty: z.string().trim().max(1000),
  vin: text.max(17),
  registration: text.max(20),
  internal_reference: text,
  purchase_price: optionalNumber,
  internal_costs: z.coerce.number().min(0).max(10000000),
});
export const contactSchema = z.object({
  first_name: text.min(1),
  last_name: text.min(1),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9(). -]{6,25}$/)
    .transform((v) => v.replace(/[(). -]/g, "")),
  postal_code: z.string().trim().max(12).default(""),
  message: z.string().trim().max(4000),
  privacy: z.literal("on"),
  marketing: z.string().optional(),
  website: z.literal(""),
});
export const listingStatuses = [
  "DRAFT",
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "ARCHIVED",
] as const;
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function canEnquire(status: string) {
  return status === "AVAILABLE";
}
export function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
