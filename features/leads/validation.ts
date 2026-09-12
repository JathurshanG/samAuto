import { z } from "zod";
const text = z.string().trim().max(200);
const count = z.coerce.number().int().min(0).max(3000000);
export const tradeSchema = z.object({
  registration: text,
  make: text.min(1),
  model: text.min(1),
  version: text,
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  mileage: count,
  fuel: text.min(1),
  condition: text.min(1),
  damages: text,
  maintenance: text,
  inspection: text,
  owners: z.union([z.literal(""), z.coerce.number().int().min(0).max(100)]),
  postal_code: z.string().regex(/^\d{5}$/),
});
export const appointmentSchema = z.object({
  desired_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .refine((v) => {
      const t = Date.parse(v);
      return (
        Number.isFinite(t) &&
        t > Date.now() - 86400000 &&
        t < Date.now() + 366 * 86400000
      );
    }, "Créneau invalide"),
});
export const workshopSchema = appointmentSchema.extend({
  service: text.min(1),
  registration: text,
  make: text.min(1),
  model: text.min(1),
  mileage: count,
});
