// 0.77.0 (Prüfer C, 07.11.2026): Der lokale Testserver liefert nur Dateien aus dem Projektordner, keine
// Punkt-Ordner (.git, .claude) und hört nur auf diesem Rechner (127.0.0.1). Vorher kam man mit „..%2f“ an den
// Desktop, und jeder im selben WLAN konnte zugreifen, solange „node server.js“ lief.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASIS = `http://127.0.0.1:${PORT}`;
const SERVER = fileURLToPath(new URL("../server.js", import.meta.url));

async function mitServer(pruefung) {
  const prozess = spawn(process.execPath, [SERVER], { env: { ...process.env, PORT: String(PORT) }, stdio: "pipe" });
  try {
    for (let i = 0; i < 50; i++) {
      try {
        await fetch(`${BASIS}/`);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    await pruefung();
  } finally {
    prozess.kill();
  }
}

test("0.77.0: Server liefert die App, aber nichts außerhalb des Projektordners und keine Punkt-Ordner", async () => {
  // Diese Datei liegt eine Ebene über dem Projekt (Desktop) und darf nie ausgeliefert werden.
  const ausserhalb = new URL("../../CLAUDE.md", import.meta.url);
  await mitServer(async () => {
    assert.equal((await fetch(`${BASIS}/`)).status, 200);
    assert.equal((await fetch(`${BASIS}/index.html`)).status, 200);
    assert.equal((await fetch(`${BASIS}/js/rechnen.js`)).status, 200);
    // „Kilossos-Geschaeftsidee“ beginnt mit „Kilossos“: Genau das ließ die alte startsWith-Prüfung durch.
    const nachbar = `/..%2fKilossos-Geschaeftsidee%2fkonkurrenz-2026-11-02.md`;
    assert.ok([403, 404].includes((await fetch(`${BASIS}${nachbar}`)).status), "Nachbarordner mit gleichem Namensanfang");
    for (const pfad of ["/..%2fCLAUDE.md", "/..%5cCLAUDE.md", "/%2e%2e%2fCLAUDE.md", "/.git/config", "/.claude/x", "/js/..%2f..%2fCLAUDE.md"]) {
      const antwort = await fetch(`${BASIS}${pfad}`);
      assert.ok(antwort.status === 403 || antwort.status === 404, `${pfad}: ${antwort.status}`);
      if (fs.existsSync(ausserhalb)) assert.doesNotMatch(await antwort.text(), /Kilossos – Abnehm-App/, pfad);
    }
    assert.equal((await fetch(`${BASIS}/%E0%A4%A`)).status, 400, "kaputte Kodierung");
  });
});

test("0.77.0: Server hört nur auf 127.0.0.1", () => {
  const text = fs.readFileSync(SERVER, "utf8");
  assert.match(text, /\.listen\(PORT, "127\.0\.0\.1"/);
});
