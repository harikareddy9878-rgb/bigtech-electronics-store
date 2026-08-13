import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const targetUrl = process.env.BIGTECH_URL || "http://localhost:3000";
await page.goto(targetUrl, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });

const evidence = resolve(dirname(fileURLToPath(import.meta.url)), "../evidence");
await page.screenshot({ path: resolve(evidence, "bigtech_storefront.png"), fullPage: true });

await page.click('[data-add="BT-PH-101"]');
await page.click('[data-view="cart"]');
await page.screenshot({ path: resolve(evidence, "cart_checkout.png"), fullPage: true });
await page.click('[data-view="checkout"]');
await page.locator("#checkout-form").evaluate(form => form.requestSubmit());
await page.waitForSelector("#success-view.active");
const successfulOrder = await page.locator("#success-card").innerText();
await page.click('#success-card [data-view="orders"]');
const orderHistory = await page.locator("#orders-list").innerText();

await page.evaluate(() => document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === "home-view")));
await page.click('[data-add="BT-LP-201"]');
await page.click('[data-view="cart"]');
await page.click('[data-view="checkout"]');
await page.selectOption('[name="paymentOutcome"]', "FAILURE");
await page.locator("#checkout-form").evaluate(form => form.requestSubmit());
await page.waitForSelector("#success-view.active");
const failedOrder = await page.locator("#success-card").innerText();

await page.click('[data-view="cart"]');
await page.click('[data-view="home"]');
await page.click("#chat-launcher");
await page.fill("#chat-input", "Suggest a gaming keyboard under 6000");
await page.locator("#chat-form").evaluate(form => form.requestSubmit());
await page.waitForTimeout(350);
await page.screenshot({ path: resolve(evidence, "ezzie_assistant.png"), fullPage: true });

const pageText = await page.locator("body").innerText();
const errorOverlay = await page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay').count();

console.log(JSON.stringify({
  successfulOrder,
  confirmedVisibleInHistory: orderHistory.includes("Confirmed"),
  failedOrder,
  pageHasContent: pageText.trim().length > 500,
  errorOverlay: Boolean(errorOverlay),
}, null, 2));
await browser.close();
