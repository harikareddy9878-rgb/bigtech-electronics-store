export const money = value => new Intl.NumberFormat("en-IN", {
  style:"currency",
  currency:"INR",
  maximumFractionDigits:0
}).format(value);

const milestoneTemplates = [
  ["ORDER_RECEIVED", "Order received", "The order details were validated and recorded.", 0],
  ["INVENTORY_RESERVED", "Items reserved", "Available units were held while payment was reviewed.", 1],
  ["PAYMENT_APPROVED", "Payment confirmed", "The selected payment method was approved.", 2],
  ["PICKING", "Picking items", "The fulfilment team is collecting the order items.", 45],
  ["PACKED", "Packed", "The products were checked, protected and labelled.", 180],
  ["SHIPPED", "Shipped", "The parcel left the fulfilment centre.", 360],
  ["OUT_FOR_DELIVERY", "Out for delivery", "The parcel is with the local delivery partner.", 4320],
  ["DELIVERED", "Delivered", "The parcel reached the delivery address.", 4740]
];

const completedThrough = {
  Confirmed:3,
  Shipped:5,
  "Out for delivery":6,
  Delivered:7
};

const eventTime = (date, minutes) => new Date(date.getTime() + minutes * 60_000).toISOString();

export function customerTimeline({ date, status, failureCode }) {
  const createdAt = new Date(date);
  if (failureCode) {
    const stoppedIndex = failureCode === "STOCK_CHANGED" ? 1 : 2;
    return milestoneTemplates.map(([code, label, message, minutes], index) => ({
      code,
      label,
      state:index < stoppedIndex ? "COMPLETED" : "STOPPED",
      message:index < stoppedIndex
        ? message
        : index === stoppedIndex
          ? failureCode === "STOCK_CHANGED"
            ? "The requested quantity was no longer available. Payment was not attempted."
            : "Payment was declined. The temporary stock hold was released automatically."
          : "This stage was not started.",
      occurredAt:index <= stoppedIndex ? eventTime(createdAt, minutes) : null
    }));
  }

  const currentIndex = completedThrough[status] ?? 3;
  return milestoneTemplates.map(([code, label, message, minutes], index) => ({
    code,
    label,
    state:status === "Delivered" || index < currentIndex ? "COMPLETED" : index === currentIndex ? "CURRENT" : "UPCOMING",
    message,
    occurredAt:index <= currentIndex ? eventTime(createdAt, minutes) : null
  }));
}

export function calculateTotals(cart, products) {
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find(entry => entry.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 49;
  return { subtotal, delivery, total:subtotal + delivery };
}

export function addCartItem(cart, product, quantity = 1) {
  if (!product || product.stock < 1) return { cart, added:false, reason:"OUT_OF_STOCK" };
  const current = cart.find(item => item.id === product.id);
  const existingQuantity = current?.quantity || 0;
  if (existingQuantity + quantity > product.stock) return { cart, added:false, reason:"INSUFFICIENT_STOCK" };
  const next = current
    ? cart.map(item => item.id === product.id ? { ...item, quantity:item.quantity + quantity } : item)
    : [...cart, { id:product.id, quantity }];
  return { cart:next, added:true };
}

export function fulfilmentDate(category, pincode, today = new Date()) {
  const extra = category === "Appliances" || category === "Televisions" ? 4 : 2;
  const remote = /^[17-9]/.test(String(pincode)) ? 1 : 0;
  const result = new Date(today);
  result.setDate(result.getDate() + extra + remote);
  return result.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

function inventoryResult(cart, products, disposition, conflictProductId) {
  return {
    disposition,
    lines:cart.map(item => {
      const product = products.find(entry => entry.id === item.id);
      const before = conflictProductId === item.id ? 0 : product?.stock ?? 0;
      return {
        productId:item.id,
        name:product?.name ?? item.id,
        requested:item.quantity,
        availableBefore:before,
        reserved:disposition === "REJECTED" ? 0 : item.quantity,
        availableAfter:disposition === "COMMITTED" ? Math.max(0, before - item.quantity) : before
      };
    })
  };
}

function workflow(outcome, address) {
  if (outcome === "STOCK_CHANGED") return [
    { agent:"Inventory Agent", status:"failed", message:"Available quantity changed before reservation." },
    { agent:"Payment Agent", status:"skipped", message:"Payment was not attempted." },
    { agent:"Fulfilment Agent", status:"skipped", message:"Picking and packing were not started." },
    { agent:"Delivery Agent", status:"skipped", message:"No delivery journey was created." },
    { agent:"Notification Agent", status:"completed", message:"The stock conflict was saved in order history." }
  ];
  if (outcome === "PAYMENT_FAILED") return [
    { agent:"Inventory Agent", status:"completed", message:"Stock was reserved temporarily." },
    { agent:"Payment Agent", status:"failed", message:"The simulated payment was declined." },
    { agent:"Fulfilment Agent", status:"skipped", message:"The inventory reservation was released." },
    { agent:"Delivery Agent", status:"skipped", message:"No delivery journey was created." },
    { agent:"Notification Agent", status:"completed", message:"The failure was saved in order history." }
  ];
  return [
    { agent:"Inventory Agent", status:"completed", message:"Stock was checked, reserved and committed." },
    { agent:"Payment Agent", status:"completed", message:"The simulated payment was authorised." },
    { agent:"Fulfilment Agent", status:"completed", message:"Picking and packing were scheduled." },
    { agent:"Delivery Agent", status:"completed", message:`Delivery milestones were planned for ${address.pincode}.` },
    { agent:"Notification Agent", status:"completed", message:"Confirmation and tracking were saved." }
  ];
}

export function createOrder({ cart, products, address, paymentOutcome, now = new Date() }) {
  if (!cart.length) return { ok:false, code:"EMPTY_CART" };
  const forcedConflict = paymentOutcome === "STOCK_CHANGED" ? cart[0].id : null;
  const unavailable = cart.find(item => {
    const product = products.find(entry => entry.id === item.id);
    return !product || product.stock < item.quantity;
  });
  const conflictProductId = forcedConflict || unavailable?.id;
  const totals = calculateTotals(cart, products);
  const id = `BIG-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2,"0")}-${String(now.getTime()).slice(-6)}`;
  const base = { id, date:now.toISOString(), items:cart.map(item => ({ ...item })), total:totals.total, address };

  if (conflictProductId) {
    const order = {
      ...base,
      status:"Stock changed",
      failureCode:"STOCK_CHANGED",
      inventory:inventoryResult(cart, products, "REJECTED", conflictProductId),
      milestones:customerTimeline({ date:now, status:"Stock changed", failureCode:"STOCK_CHANGED" }),
      workflow:workflow("STOCK_CHANGED", address)
    };
    return { ok:false, code:"STOCK_CHANGED", productId:conflictProductId, order };
  }

  if (paymentOutcome === "FAILURE") {
    const order = {
      ...base,
      status:"Payment failed",
      failureCode:"PAYMENT_FAILED",
      inventory:inventoryResult(cart, products, "RELEASED"),
      milestones:customerTimeline({ date:now, status:"Payment failed", failureCode:"PAYMENT_FAILED" }),
      workflow:workflow("PAYMENT_FAILED", address)
    };
    return { ok:false, code:"PAYMENT_FAILED", order };
  }

  const slowest = cart
    .map(item => products.find(product => product.id === item.id)?.category)
    .find(category => ["Appliances", "Televisions"].includes(category)) || "Phones";
  const order = {
    ...base,
    status:"Confirmed",
    delivery:fulfilmentDate(slowest, address.pincode, now),
    inventory:inventoryResult(cart, products, "COMMITTED"),
    milestones:customerTimeline({ date:now, status:"Confirmed" }),
    workflow:workflow("SUCCESS", address)
  };
  return { ok:true, order };
}

export function answerEzzie(message, { products, cart, orders }) {
  const text = message.trim().toLowerCase();
  if (!text) return { text:"Tell me what you need help with inside BigTech." };
  const orderId = message.match(/BIG-[A-Z0-9-]+/i)?.[0]?.toUpperCase();
  if (orderId) {
    const order = orders.find(entry => entry.id === orderId);
    if (!order) return { text:`I could not find ${orderId} in this browser. Open My orders to see saved demo orders.` };
    const active = order.milestones?.find(stage => stage.state === "CURRENT");
    return { text:`${order.id} is ${order.status}. ${order.delivery ? `Estimated delivery is ${order.delivery}.` : "No delivery is scheduled because checkout did not complete."}${active ? ` Current step: ${active.label}.` : ""}` };
  }
  if (/cart|basket/.test(text)) {
    if (!cart.length) return { text:"Your cart is empty. Tell me a category or budget and I can suggest something." };
    const names = cart.map(item => `${item.quantity} × ${products.find(product => product.id === item.id)?.name}`).join("\n");
    return { text:`Your cart has:\n${names}` };
  }
  if (/return|refund|replace/.test(text)) return { text:"BigTech demo orders have a seven day return window for eligible unused products. Appliances should be checked for installation damage at delivery. This project does not issue real refunds." };
  if (/deliver|shipping|pincode|arrive/.test(text)) return { text:"Phones, laptops, and audio usually show a two day estimate. TVs and appliances use a four day estimate. Each confirmed order displays progress from picking through delivery." };
  if (/payment|upi|card|failed/.test(text)) return { text:"Checkout simulates successful and failed payments without collecting UPI, card, or bank details. A failed payment releases its stock hold and creates no delivery." };
  if (/order|track/.test(text)) return { text:"Open My orders from the header to view recent orders and their full delivery timelines. You can also send an order number such as BIG-DEMO-731902 and I will check it." };
  if (/laptop|phone|mobile|tv|television|audio|headphone|earbud|speaker|appliance|washing|fridge|refrigerator|microwave|conditioner|watch|wearable|gaming|controller|keyboard|monitor|console|budget|suggest|recommend/.test(text)) {
    let candidates = products.filter(product => product.stock > 0);
    const categoryMap = [[/laptop/,"Laptops"],[/phone|mobile/,"Phones"],[/tv|television/,"Televisions"],[/audio|headphone|earbud|speaker/,"Audio"],[/appliance|washing|fridge|refrigerator|microwave|conditioner/,"Appliances"],[/watch|wearable|ring/,"Wearables"],[/gaming|controller|keyboard|monitor|console/,"Gaming"]];
    const category = categoryMap.find(([pattern]) => pattern.test(text))?.[1];
    if (category) candidates = candidates.filter(product => product.category === category);
    const budget = Number(text.match(/(?:under|below|budget(?: of)?)[ ₹]*(\d[\d,]*)/)?.[1]?.replaceAll(",", ""));
    if (budget) candidates = candidates.filter(product => product.price <= budget);
    candidates.sort((a,b) => b.rating - a.rating || a.price - b.price);
    const choice = candidates[0];
    if (!choice) return { text:"I could not find an in stock match for that request. Try a different budget or category." };
    return { text:`My best match is ${choice.name} at ${money(choice.price)}. It is rated ${choice.rating} and has ${choice.stock} in stock.`, productId:choice.id };
  }
  if (/stock|available|out of stock|inventory/.test(text)) return { text:"Product cards show current demo stock. Checkout temporarily reserves each unit, commits it only after payment, and releases it after a failed payment." };
  if (/account|profile|address/.test(text)) return { text:"Open Account in the header to see the saved demo profile, delivery address, inventory summary, and recent activity. Cart, stock, and orders stay in this browser." };
  if (/help|what can you do|ezzie/.test(text)) return { text:"I can suggest BigTech products, check your cart, explain stock, checkout, payment, delivery, returns, and look up demo order numbers. I stay within this website." };
  return { text:"I can help only with BigTech products, cart, checkout, payments, delivery, returns, and orders. Try asking for a laptop under ₹60,000 or send a BigTech order number." };
}
