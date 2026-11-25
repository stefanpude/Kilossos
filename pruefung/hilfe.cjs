// Gemeinsames für alle Abläufe: jeder Test schlägt fehl, wenn die Seite einen Fehler in die Konsole schreibt.
const { test: basis, expect } = require("@playwright/test");

const test = basis.extend({
  page: async ({ page }, use) => {
    const fehler = [];
    page.on("console", (m) => m.type() === "error" && fehler.push(m.text()));
    page.on("pageerror", (e) => fehler.push(e.message));
    await use(page);
    expect(fehler, "Fehler in der Konsole").toEqual([]);
  },
});


// Erster Start: die drei Schritte der Einrichtung durchklicken und eine Katze anlegen.
async function katzeAnlegen(page, name = "Testkatze") {
  await page.goto("/");
  await page.locator("#willkommen-1 [data-aktion=einrichtung-weiter]").click();
  await page.locator("#willkommen-2 [data-aktion=einrichtung-weiter][data-schritt='3']").click();
  await page.locator("#form-einrichtung [name=name]").fill(name);
  await waehle(page, "#einrichtung-geschlecht", "Kater");
  await waehle(page, "#einrichtung-kastriert", "ja");
  await page.getByRole("button", { name: "Los geht's" }).click();
  await expect(page.locator("[data-ansicht=heute]")).toBeVisible();
}

// Eigenes Auswahlmenü: Knopf öffnet die Liste, dann den Eintrag mit dem Text antippen.
async function waehle(page, bereich, text) {
  await page.locator(`${bereich} .auswahl-knopf`).click();
  await page.locator(`${bereich} li[data-text="${text}"]`).click();
}

const ansicht = (page, name) => page.locator(`[data-ansicht=${name}]`);
module.exports = { test, expect, katzeAnlegen, waehle, ansicht };
