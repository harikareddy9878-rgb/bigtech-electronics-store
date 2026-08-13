import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../public/js/products.js";
import { addCartItem, answerEzzie, calculateTotals, createOrder } from "../public/js/store.js";

test("adds an available product and blocks an out of stock product", () => {
  const available = addCartItem([], products.find(product => product.id === "BT-PH-101"));
  assert.equal(available.added, true);
  const unavailable = addCartItem([], products.find(product => product.id === "BT-PH-104"));
  assert.equal(unavailable.reason, "OUT_OF_STOCK");
});

test("calculates free delivery for the catalogue order", () => {
  const totals = calculateTotals([{ id:"BT-AU-402", quantity:1 }], products);
  assert.equal(totals.delivery, 0);
  assert.equal(totals.total, 3999);
});

test("payment failure has no delivery schedule", () => {
  const result = createOrder({ cart:[{ id:"BT-PH-101", quantity:1 }], products, address:{ pincode:"500081" }, paymentOutcome:"FAILURE", now:new Date("2026-08-13T10:00:00Z") });
  assert.equal(result.ok, false);
  assert.equal(result.code, "PAYMENT_FAILED");
  assert.equal(result.order.delivery, undefined);
});

test("Ezzie stays within the BigTech website", () => {
  const response = answerEzzie("Who won the cricket match?", { products, cart:[], orders:[] });
  assert.match(response.text, /help only with BigTech/);
});

test("Ezzie suggests an in-stock laptop within budget", () => {
  const response = answerEzzie("Suggest a laptop under 60000", { products, cart:[], orders:[] });
  assert.ok(response.productId);
  assert.ok(products.find(product => product.id === response.productId).price <= 60000);
});

