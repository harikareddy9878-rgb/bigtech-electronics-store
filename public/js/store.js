export const money = value => new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(value);

export function calculateTotals(cart, products) {
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find(entry => entry.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 49;
  return { subtotal, delivery, total: subtotal + delivery };
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
  const remote = String(pincode).startsWith("11") ? 1 : 0;
  const result = new Date(today);
  result.setDate(result.getDate() + extra + remote);
  return result.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

export function createOrder({ cart, products, address, paymentOutcome, now = new Date() }) {
  if (!cart.length) return { ok:false, code:"EMPTY_CART" };
  for (const item of cart) {
    const product = products.find(entry => entry.id === item.id);
    if (!product || product.stock < item.quantity) return { ok:false, code:"STOCK_CHANGED", productId:item.id };
  }
  const totals = calculateTotals(cart, products);
  const id = `BIG-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2,"0")}-${String(now.getTime()).slice(-6)}`;
  if (paymentOutcome === "FAILURE") return { ok:false, code:"PAYMENT_FAILED", order:{ id, status:"Payment failed", date:now.toISOString(), items:cart, total:totals.total } };
  const slowest = cart.map(item => products.find(product => product.id === item.id)?.category).find(category => ["Appliances","Televisions"].includes(category)) || "Phones";
  return { ok:true, order:{ id, status:"Confirmed", date:now.toISOString(), items:cart, total:totals.total, delivery:fulfilmentDate(slowest, address.pincode, now), address } };
}

export function answerEzzie(message, { products, cart, orders }) {
  const text = message.trim().toLowerCase();
  if (!text) return { text:"Tell me what you need help with inside BigTech." };
  const orderId = message.match(/BIG-[A-Z0-9-]+/i)?.[0]?.toUpperCase();
  if (orderId) {
    const order = orders.find(entry => entry.id === orderId);
    if (!order) return { text:`I could not find ${orderId} in this browser. Open My orders to see saved demo orders.` };
    return { text:`${order.id} is ${order.status}. ${order.delivery ? `Estimated delivery is ${order.delivery}.` : "No delivery is scheduled because payment did not complete."}` };
  }
  if (/cart|basket/.test(text)) {
    if (!cart.length) return { text:"Your cart is empty. Tell me a category or budget and I can suggest something." };
    const names = cart.map(item => `${item.quantity} × ${products.find(product => product.id === item.id)?.name}`).join("\n");
    return { text:`Your cart has:\n${names}` };
  }
  if (/return|refund|replace/.test(text)) return { text:"BigTech demo orders have a seven day return window for eligible unused products. Appliances should be checked for installation damage at delivery. This project does not issue real refunds." };
  if (/deliver|shipping|pincode|arrive/.test(text)) return { text:"Phones, laptops, and audio usually show a two day estimate. TVs and appliances use a four day estimate. The exact date appears at checkout after a six digit pincode is entered." };
  if (/payment|upi|card|failed/.test(text)) return { text:"Checkout simulates successful and failed payments without collecting UPI, card, or bank details. A failed payment is saved in My orders with no delivery date." };
  if (/order|track/.test(text)) return { text:"Open My orders from the header to view recent orders. You can also send an order number such as BIG-2608-123456 and I will check it." };
  if (/laptop|phone|mobile|tv|television|audio|headphone|earbud|speaker|appliance|washing|fridge|refrigerator|microwave|conditioner|budget|suggest|recommend/.test(text)) {
    let candidates = products.filter(product => product.stock > 0);
    const categoryMap = [[/laptop/,"Laptops"],[/phone|mobile/,"Phones"],[/tv|television/,"Televisions"],[/audio|headphone|earbud|speaker/,"Audio"],[/appliance|washing|fridge|refrigerator|microwave|conditioner/,"Appliances"]];
    const category = categoryMap.find(([pattern]) => pattern.test(text))?.[1];
    if (category) candidates = candidates.filter(product => product.category === category);
    const budget = Number(text.match(/(?:under|below|budget(?: of)?)[ ₹]*(\d[\d,]*)/)?.[1]?.replaceAll(",", ""));
    if (budget) candidates = candidates.filter(product => product.price <= budget);
    candidates.sort((a,b) => b.rating - a.rating || a.price - b.price);
    const choice = candidates[0];
    if (!choice) return { text:"I could not find an in-stock match for that request. Try a different budget or category." };
    return { text:`My best match is ${choice.name} at ${money(choice.price)}. It is rated ${choice.rating} and has ${choice.stock} in stock.`, productId:choice.id };
  }
  if (/stock|available|out of stock/.test(text)) return { text:"Product cards show current demo stock. Out-of-stock items cannot be added, and checkout checks stock again before payment." };
  if (/account|profile|address/.test(text)) return { text:"This compact demo stores cart and order history only in your browser. Delivery details are entered at checkout and no account registration is required." };
  if (/help|what can you do|ezzie/.test(text)) return { text:"I can suggest BigTech products, check your cart, explain stock, checkout, payment, delivery, returns, and look up demo order numbers. I stay within this website." };
  return { text:"I can help only with BigTech products, cart, checkout, payments, delivery, returns, and orders. Try asking for a laptop under ₹60,000 or send a BigTech order number." };
}

