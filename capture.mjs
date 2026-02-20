import { chromium } from "playwright";
import fs from "fs";

const OUT_DIR = "out";
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const charts = [
  { name: "gold_xauusd_1h", url: "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD" },
  { name: "eurusd_1h", url: "PASTE_EURUSD_PUBLIC_URL_HERE" },
  { name: "gbpusd_1h", url: "PASTE_GBPUSD_PUBLIC_URL_HERE" },
];

// Best-effort chart-area capture (TradingView DOM varies). Falls back to viewport screenshot.
async function screenshotChart(page, name) {
  const selectors = [
    "#tv_chart_container",
    "div.tv-chart-view",
    "div[data-role='chart']",
    "div.chart-container",
    "body",
  ];

  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    if (await loc.count()) {
      const box = await loc.boundingBox();
      if (box && box.width > 400 && box.height > 300) {
        await loc.screenshot({ path: `${OUT_DIR}/${name}.png` });
        return;
      }
    }
  }

  await page.screenshot({ path: `${OUT_DIR}/${name}.png`, fullPage: false });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  for (const c of charts) {
    if (c.url.includes("PASTE_")) {
      throw new Error(
        `Missing URL for ${c.name}. Replace PASTE_* in capture.mjs with the public TradingView link.`
      );
    }

    await page.goto(c.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(6000); // let the chart render
    await screenshotChart(page, c.name);
  }

  await browser.close();
  console.log("Saved screenshots to /out");
})();
