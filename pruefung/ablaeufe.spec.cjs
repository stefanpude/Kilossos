// Abläufe im echten Browser. Bei Fehlschlag zeigt `npx playwright show-report` Bilder und Ablauf.
const { test, expect, katzeAnlegen, ansicht } = require("./hilfe.cjs");

test("1 Erster Start: Einrichtung, Katze anlegen, landet auf „Heute“", async ({ page }) => {
  await katzeAnlegen(page, "Testkatze");
  await expect(page.locator("#tiername")).toHaveText("Testkatze");
  await expect(page.locator("#willkommen")).toBeHidden();
});

test("2 Gewicht eintragen, bleibt nach dem Neuladen", async ({ page }) => {
  await katzeAnlegen(page);
  await page.locator(".leiste button[data-ziel=gewicht]").click();
  await ansicht(page, "gewicht").getByRole("button", { name: "Gewicht eintragen" }).click();
  const dialog = page.locator("#dialog-gewicht");
  await dialog.locator("[name=kg]").fill("9,32");
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#gewicht-aktuell")).toHaveText("9,32");
  await page.reload();
  await page.locator(".leiste button[data-ziel=gewicht]").click();
  await expect(page.locator("#gewicht-aktuell")).toHaveText("9,32");
});

test("3 Mahlzeit aus der Futterliste: 50 g Sheba = 39 kcal", async ({ page }) => {
  await katzeAnlegen(page);
  await ansicht(page, "heute").getByRole("button", { name: "Mahlzeit eintragen" }).click();
  const dialog = page.locator("#dialog-mahlzeit");
  await dialog.locator("#mahlzeit-futter .auswahl-knopf").click();
  await dialog.locator("li[data-aktion=liste-oeffnen]").click();
  await page.locator("#liste-suche").fill("Sheba Fresh");
  await page.locator("[data-id=sheba-fresh-fine-huhn-gefluegel-truthahn]").click();
  await expect(page.locator("#dialog-liste")).toBeHidden();
  await dialog.locator("[name=uhrzeit]").fill("08:00");
  await dialog.locator("[name=gramm]").fill("50");
  // 77 kcal/100 g × 50 g = 38,5 kcal; die App zeigt kcal überall auf ganze Zahlen gerundet.
  await expect(dialog.locator("#mahlzeit-vorschau")).toHaveText("= 39 kcal");
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#kcal-zahl")).toHaveText("39");
  await expect(page.locator("#heute-mahlzeiten")).toContainText("50");
});

test("4 Demo am Handy: alle Bereiche antippen, Zurück führt zu „Heute“ @handy", async ({ page }) => {
  await page.goto("/?demo");
  await expect(page.locator("#tiername")).toHaveText("Kito");
  for (const ziel of ["gewicht", "verlauf", "futter", "mehr", "heute"]) {
    await page.locator(`.leiste button[data-ziel=${ziel}]`).tap();
    await expect(ansicht(page, ziel)).toBeVisible();
    const breite = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(breite, `${ziel} steht seitlich über`).toBeLessThanOrEqual(0);
  }
  await page.locator(".leiste button[data-ziel=verlauf]").tap();
  await expect(ansicht(page, "verlauf")).toBeVisible();
  await page.goBack();
  await expect(ansicht(page, "heute")).toBeVisible();
});

test("5 Offline: nach dem ersten Besuch startet die App ohne Netz", async ({ page, context }) => {
  await katzeAnlegen(page, "Offline");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // jetzt steuert der Service Worker die Seite
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#tiername")).toHaveText("Offline");
  await context.setOffline(false);
});

test.describe("6 Grundbilder", () => {
  // Die Demo verschiebt ihre Daten auf das heutige Datum. Mit fester Uhrzeit sieht sie jeden Tag gleich aus.
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-25T10:00:00"));
    await page.goto("/?demo");
    await expect(page.locator("#tiername")).toHaveText("Kito");
  });

  test("Demo „Heute“ am Handy @handy", async ({ page }) => {
    await expect(page).toHaveScreenshot("demo-heute.png");
  });

  test("Demo „Verlauf“ am Handy @handy", async ({ page }) => {
    await page.locator(".leiste button[data-ziel=verlauf]").tap();
    await expect(ansicht(page, "verlauf")).toBeVisible();
    await expect(page).toHaveScreenshot("demo-verlauf.png");
  });
});
