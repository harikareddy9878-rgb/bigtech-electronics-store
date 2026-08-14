import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const browser = await chromium.launch({
  headless:true,
  executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport:{ width:1440, height:1000 } });
const targetUrl = process.env.BIGTECH_URL || "http://localhost:3000";
const evidence = resolve(dirname(fileURLToPath(import.meta.url)), "../evidence");
const captureEvidence = process.env.BIGTECH_CAPTURE_EVIDENCE !== "0";

await page.goto(targetUrl, { waitUntil:"networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil:"networkidle" });
if (captureEvidence) await page.screenshot({ path:resolve(evidence, "bigtech_storefront_overview.png") });

const stockBefore = await page.locator('[data-add="BT-PH-101"]').locator("..").locator(".stock").innerText();
await page.click('[data-add="BT-PH-101"]');
await page.click('[data-view="cart"]');
await page.click('[data-view="checkout"]');
if (captureEvidence) await page.screenshot({ path:resolve(evidence, "cart_checkout.png"), fullPage:true });
await page.locator("#checkout-form").evaluate(form => form.requestSubmit());
await page.waitForSelector("#success-view.active");
const successfulOrder = await page.locator("#success-card").innerText();
await page.click('#success-card [data-order-detail]');
await page.waitForSelector("#order-detail-view.active");
const successfulJourney = await page.locator("#order-detail-card").innerText();
if (captureEvidence) await page.screenshot({ path:resolve(evidence, "order_journey.png"), fullPage:true });

await page.click('#order-detail-view [data-view="orders"]');
const orderHistory = await page.locator("#orders-list").innerText();
await page.click('#orders-view [data-view="home"]');
const stockAfter = await page.locator('[data-add="BT-PH-101"]').locator("..").locator(".stock").innerText();

await page.click('[data-add="BT-LP-201"]');
await page.click('[data-view="cart"]');
await page.click('[data-view="checkout"]');
await page.selectOption('[name="paymentOutcome"]', "FAILURE");
await page.locator("#checkout-form").evaluate(form => form.requestSubmit());
await page.waitForSelector("#success-view.active");
const failedOrder = await page.locator("#success-card").innerText();
await page.click('#success-card [data-order-detail]');
const releasedInventory = await page.locator("#order-detail-card").innerText();

await page.click('#order-detail-view [data-view="orders"]');
await page.click('#orders-view [data-view="home"]');
await page.click('[data-add="BT-GM-701"]');
await page.click('[data-view="cart"]');
await page.click('[data-view="checkout"]');
await page.selectOption('[name="paymentOutcome"]', "STOCK_CHANGED");
await page.locator("#checkout-form").evaluate(form => form.requestSubmit());
await page.waitForSelector("#success-view.active");
const stockConflict = await page.locator("#success-card").innerText();

await page.click('[data-view="account"]');
const accountInventory = await page.locator("#inventory-overview").innerText();
if (captureEvidence) await page.screenshot({ path:resolve(evidence, "inventory_account.png"), fullPage:true });

await page.click("#chat-launcher");
await page.fill("#chat-input", "Check BIG-DEMO-731902");
await page.locator("#chat-form").evaluate(form => form.requestSubmit());
await page.waitForTimeout(350);
if (captureEvidence) await page.screenshot({ path:resolve(evidence, "ezzie_support.png") });
const assistantText = await page.locator("#chat-messages").innerText();

const pageText = await page.locator("body").innerText();
const errorOverlay = await page.locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay').count();

console.log(JSON.stringify({
  successfulOrder,
  successfulJourneyHasEightStages:["Order received", "Items reserved", "Payment confirmed", "Picking items", "Packed", "Shipped", "Out for delivery", "Delivered"].every(label => successfulJourney.includes(label)),
  confirmedVisibleInHistory:orderHistory.includes("Confirmed"),
  inventoryCommitted:successfulJourney.includes("Stock committed") && stockBefore !== stockAfter,
  failedOrder,
  inventoryReleased:releasedInventory.includes("Reservation released"),
  stockConflict,
  stockRejected:stockConflict.includes("before payment"),
  accountHasInventory:accountInventory.includes("Catalogue availability"),
  assistantOrderLookup:assistantText.includes("BIG-DEMO-731902") && assistantText.includes("Shipped"),
  customerUiHidesAgents:!pageText.includes("Inventory Agent") && !pageText.includes("Payment Agent"),
  pageHasContent:pageText.trim().length > 500,
  errorOverlay:Boolean(errorOverlay),
}, null, 2));
await browser.close();
