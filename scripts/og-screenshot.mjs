/**
 * One-shot OG image generator.
 * Loads the live production site at 1200×630, waits for the bust to
 * settle, and writes public/og-image.png. Run via: node scripts/og-screenshot.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const URL = process.env.OG_URL || "http://127.0.0.1:4321";
const OUT = "public/og-image.png";

mkdirSync(dirname(OUT), { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

// Wait for the foreground bust to fire its load event. We only gate
// on the foreground viewer; the moss backdrop sits at 9% opacity so
// its load state has negligible visual impact. Race against a 30s
// safety timeout so we never hang.
await page.evaluate(
  () =>
    new Promise((resolve) => {
      const safety = setTimeout(resolve, 30000);
      const wait = () => {
        const viewer = document.querySelector(".octavian-bust model-viewer");
        if (!viewer) {
          setTimeout(wait, 100);
          return;
        }
        if (viewer.loaded === true) {
          clearTimeout(safety);
          resolve();
          return;
        }
        viewer.addEventListener(
          "load",
          () => {
            clearTimeout(safety);
            resolve();
          },
          { once: true },
        );
      };
      wait();
    }),
);

// Hide every piece of model-viewer chrome — the progress bar, the
// progress mask, and the AR button live in the shadow DOM and only
// ::part() can reach them. Doubled with display + visibility for
// belt-and-braces.
await page.addStyleTag({
  content: `
    model-viewer::part(default-progress-bar),
    model-viewer::part(default-progress-mask),
    model-viewer::part(default-ar-button) {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
    .lobby-scroll-cue { display: none !important; }
    /* Astro dev toolbar appears in dev mode as a pill at the bottom. */
    astro-dev-toolbar,
    astro-dev-overlay,
    [data-astro-dev-overlay],
    [data-astro-dev-toolbar] {
      display: none !important;
      visibility: hidden !important;
    }
  `,
});

// Let anime.js intro chain (~1.9s) settle and one frame paint with the
// progress chrome hidden.
await page.waitForTimeout(2500);
await page.screenshot({ path: OUT, type: "png" });
await browser.close();
console.log("wrote", OUT);
