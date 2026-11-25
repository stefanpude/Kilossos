// Browser-Prüfung für Kilossos mit Playwright (seit 25.11.2026).
// Start im Projektordner:  npm run pruefung          → alle Abläufe, vergleicht mit den Grundbildern
//                          npm run pruefung -- -u    → nimmt den aktuellen Stand als neue Grundbilder
// Liegt bewusst nicht in tests/: `npm test` (node --test tests/) würde die Dateien sonst mitnehmen.
// Version 1.49.1 fest, weil dazu das schon installierte Chromium (chromium-1148) passt, kein Download.
// Dateien als .cjs: Playwright 1.49.1 hängt unter Node 26 beim Laden von .mjs-Dateien (ohne Meldung).
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: ".",
  outputDir: "../test-results",
  timeout: 30000,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "../playwright-report" }]],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
  use: { baseURL: "http://127.0.0.1:8798", locale: "de-DE", timezoneId: "Europe/Berlin" },
  webServer: {
    // eigener Server auf 8798, der Vorschau-Server auf 8080 bleibt frei
    command: "node server.js",
    cwd: "..",
    env: { ...process.env, PORT: "8798" },
    url: "http://127.0.0.1:8798/index.html",
    reuseExistingServer: true,
  },
  projects: [
    { name: "pc", use: { browserName: "chromium", channel: "chrome", viewport: { width: 1000, height: 800 } }, grepInvert: /@handy/ },
    { name: "handy", use: { ...devices["Pixel 7"], channel: "chrome" }, grep: /@handy/ },
  ],
});
