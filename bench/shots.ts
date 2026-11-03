import { chromium } from "playwright";
import { toUrl } from "../src/visual.ts";

const browser = await chromium.launch();
for (const name of ["dashboard", "settings"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(toUrl(`playbook/exemplars/${name}.html`), { waitUntil: "networkidle" });
  await page.screenshot({ path: `bench/assets/${name}.png`, fullPage: true });
  console.log(`bench/assets/${name}.png`);
}
await browser.close();
