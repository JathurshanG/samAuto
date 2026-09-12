import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
test.describe("real Supabase workflows — disposable local project", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "Requires seeded local Supabase and E2E admin credentials.",
  );
  async function login(page: Page) {
    await page.goto("/connexion");
    await page
      .getByLabel("Email", { exact: true })
      .fill(process.env.E2E_ADMIN_EMAIL!);
    await page
      .getByLabel("Mot de passe", { exact: true })
      .fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/admin/);
  }
  async function contact(page: Page) {
    await page.getByLabel("Prénom", { exact: true }).fill("Test");
    await page.getByLabel("Nom", { exact: true }).fill("E2E");
    await page.getByLabel("Téléphone", { exact: true }).fill("0612345678");
    await page.getByLabel("Email", { exact: true }).fill("e2e@example.test");
    await page.locator('[name="privacy"]').check();
  }
  test("seller creates, uploads, publishes; buyer enquires and lead appears in admin", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin/vehicules/nouveau");
    await page.getByLabel("Marque", { exact: true }).fill("E2E");
    await page.getByLabel("Modèle", { exact: true }).fill(`Test-${Date.now()}`);
    await page.getByLabel("Année", { exact: true }).fill("2022");
    await page.getByLabel("Kilométrage", { exact: true }).fill("12000");
    await page.getByLabel("Prix de vente (€)", { exact: true }).fill("14000");
    await page
      .getByRole("button", { name: "Enregistrer", exact: true })
      .click();
    await expect(page).toHaveURL(/admin\/vehicules\/[a-f0-9-]+$/);
    await page
      .locator('input[type="file"]')
      .setInputFiles(path.resolve("tests/fixtures/photo.png"));
    await page.getByRole("button", { name: "Ajouter les photos" }).click();
    await expect(
      page.getByRole("link", { name: "Photo 1", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Disponible", exact: true }).click();
    await expect(
      page.getByRole("link", { name: "Voir la fiche publique" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Voir la fiche publique" }).click();
    await contact(page);
    await page.locator('textarea[name="message"]').fill("Demande de test E2E");
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByRole("status")).toContainText("transmise");
    await page.goto("/admin/leads?q=E2E");
    await expect(
      page.getByRole("cell", { name: /Test E2E/ }).first(),
    ).toBeVisible();
  });
  test("workshop request appears in workshop inbox", async ({ page }) => {
    await page.goto("/atelier");
    await page
      .getByLabel("Intervention", { exact: true })
      .selectOption({ index: 1 });
    await page.getByLabel("Marque", { exact: true }).fill("Test");
    await page.getByLabel("Modèle", { exact: true }).fill("Test");
    await page.getByLabel("Kilométrage", { exact: true }).fill("50000");
    const desired = new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .slice(0, 16);
    await page.locator('[name="desired_at"]').fill(desired);
    await contact(page);
    await page.locator('[name="message"]').fill("Atelier E2E");
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByRole("status")).toContainText("transmise");
    await login(page);
    await page.goto("/admin/atelier?q=E2E");
    await expect(
      page.getByRole("cell", { name: /Test E2E/ }).first(),
    ).toBeVisible();
  });
  test("trade-in wizard accepts photos and appears in admin", async ({
    page,
  }) => {
    await page.goto("/reprise");
    await page.getByLabel("Marque", { exact: true }).fill("Test");
    await page.getByLabel("Modèle", { exact: true }).fill("Reprise");
    await page.getByLabel("Année", { exact: true }).fill("2020");
    await page.getByLabel("Kilométrage", { exact: true }).fill("80000");
    await page.getByLabel("Carburant", { exact: true }).fill("Essence");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("État général", { exact: true }).fill("Bon");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page
      .locator('input[type="file"]')
      .setInputFiles(path.resolve("tests/fixtures/photo.png"));
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("Prénom", { exact: true }).fill("Test");
    await page.getByLabel("Nom", { exact: true }).fill("E2E");
    await page.getByLabel("Téléphone", { exact: true }).fill("0612345678");
    await page.getByLabel("Email", { exact: true }).fill("e2e@example.test");
    await page.getByLabel("Code postal", { exact: true }).fill("75001");
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.locator('[name="privacy"]').check();
    await page.getByRole("button", { name: "Envoyer ma demande" }).click();
    await expect(page.getByRole("status")).toContainText("transmise");
    await login(page);
    await page.goto("/admin/reprises?q=E2E");
    await expect(
      page.getByRole("cell", { name: /Test E2E/ }).first(),
    ).toBeVisible();
  });
});
