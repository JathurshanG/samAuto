import { test, expect } from "@playwright/test";
const routes = [
  "/",
  "/vehicules",
  "/reprise",
  "/financement",
  "/atelier",
  "/rendez-vous",
  "/a-propos",
  "/contact",
  "/mentions-legales",
  "/politique-confidentialite",
];
for (const route of routes)
  test(`route ${route} renders on desktop/mobile`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
test("admin redirects an unauthenticated visitor", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/connexion/);
});
test("catalogue filters survive in the URL", async ({ page }) => {
  await page.goto("/vehicules");
  await page.getByLabel("Marque", { exact: true }).fill("Peugeot");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  await expect(page).toHaveURL(/make=Peugeot/);
});
test("refusing analytics does not prevent navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Refuser", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Préférences de mesure d’audience" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("samauto-analytics")),
  ).toBe("no");
});
