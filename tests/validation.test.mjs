import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canEnquire,
  slugify,
  safeJson,
  contactSchema,
  vehicleSchema,
} from "../lib/validation.ts";
import { tradeSchema, workshopSchema } from "../features/leads/validation.ts";
test("sold/reserved/draft/archived listings cannot collect purchase leads", () => {
  for (const status of ["SOLD", "RESERVED", "DRAFT", "ARCHIVED"])
    assert.equal(canEnquire(status), false);
  assert.equal(canEnquire("AVAILABLE"), true);
});
test("JSON-LD cannot break out of script tag", () => {
  const output = safeJson({ text: "</script><script>alert(1)</script>" });
  assert.ok(!output.includes("<"));
  assert.equal(JSON.parse(output).text, "</script><script>alert(1)</script>");
});
test("slugs are deterministic and URL safe", () => {
  assert.equal(slugify("Citroën C4 — Électrique"), "citroen-c4-electrique");
});
const contact = {
  first_name: "Jean",
  last_name: "Test",
  email: "test@example.test",
  phone: "06 12 34 56 78",
  message: "Question",
  privacy: "on",
  website: "",
};
test("operational acknowledgment is required, marketing is independent", () => {
  const result = contactSchema.parse(contact);
  assert.equal(result.marketing, undefined);
  assert.equal(result.phone, "0612345678");
  assert.equal(
    contactSchema.safeParse({ ...contact, privacy: "" }).success,
    false,
  );
});
test("spam and malformed contacts are rejected", () => {
  assert.equal(
    contactSchema.safeParse({ ...contact, website: "spam" }).success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...contact, email: "bad" }).success,
    false,
  );
  assert.equal(
    contactSchema.safeParse({ ...contact, message: "x".repeat(4001) }).success,
    false,
  );
});
test("invalid mileage, year and sale price are rejected", () => {
  const v = {
    make: "Test",
    model: "Test",
    year: 2022,
    mileage: -1,
    fuel: "Essence",
    transmission: "Manuelle",
    first_registration: "",
    description: "",
    equipment: "",
    price: 0,
    warranty: "",
    vin: "",
    registration: "",
    internal_reference: "",
    internal_costs: 0,
  };
  assert.equal(vehicleSchema.safeParse(v).success, false);
  assert.equal(
    vehicleSchema.safeParse({ ...v, mileage: 1, price: 10000 }).success,
    true,
  );
});
test("trade-in requires vehicle condition and complete coordinates", () => {
  assert.equal(
    tradeSchema.safeParse({ make: "BMW", model: "320" }).success,
    false,
  );
});
test("workshop cannot accept an invalid desired time", () => {
  assert.equal(
    workshopSchema.safeParse({
      desired_at: "yesterday",
      service: "Vidange",
      registration: "",
      make: "BMW",
      model: "320",
      mileage: 10000,
    }).success,
    false,
  );
});
