import { categories, products, searchProducts } from "./products.js";
import {
  addCartItem,
  answerEzzie,
  calculateTotals,
  createOrder,
  customerTimeline,
  money
} from "./store.js";

const CART_KEY = "bigtech-cart-v2";
const ORDER_KEY = "bigtech-orders-v2";
const INVENTORY_KEY = "bigtech-inventory-v2";

const productById = id => products.find(product => product.id === id);
const saved = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
};

function seedOrder({ id, status, date, delivery, total, productId, failureCode }) {
  const product = productById(productId);
  const disposition = failureCode === "PAYMENT_FAILED" ? "RELEASED" : failureCode === "STOCK_CHANGED" ? "REJECTED" : "COMMITTED";
  const before = failureCode === "STOCK_CHANGED" ? 0 : product.stock;
  return {
    id,
    status,
    date,
    delivery,
    total,
    items:[{ id:productId, quantity:1 }],
    address:{ name:"Harika", city:"Hyderabad", pincode:"500081" },
    failureCode,
    inventory:{
      disposition,
      lines:[{
        productId,
        name:product.name,
        requested:1,
        availableBefore:before,
        reserved:disposition === "REJECTED" ? 0 : 1,
        availableAfter:disposition === "COMMITTED" ? Math.max(0, before - 1) : before
      }]
    },
    milestones:customerTimeline({ date, status, failureCode }),
    workflow:[]
  };
}

const demoOrders = [
  seedOrder({ id:"BIG-DEMO-884210", status:"Out for delivery", date:"2026-08-10T08:20:00.000Z", delivery:"13 Aug 2026", total:3999, productId:"BT-AU-402" }),
  seedOrder({ id:"BIG-DEMO-731902", status:"Shipped", date:"2026-08-11T10:30:00.000Z", delivery:"15 Aug 2026", total:6999, productId:"BT-AU-401" }),
  seedOrder({ id:"BIG-DEMO-406315", status:"Delivered", date:"2026-08-03T09:10:00.000Z", delivery:"5 Aug 2026", total:24999, productId:"BT-PH-101" }),
  seedOrder({ id:"BIG-DEMO-185420", status:"Payment failed", date:"2026-08-09T14:15:00.000Z", total:52990, productId:"BT-LP-201", failureCode:"PAYMENT_FAILED" }),
  seedOrder({ id:"BIG-DEMO-092744", status:"Stock changed", date:"2026-08-08T11:40:00.000Z", total:3199, productId:"BT-GM-703", failureCode:"STOCK_CHANGED" })
];

const state = {
  cart:saved(CART_KEY, []),
  orders:saved(ORDER_KEY, demoOrders),
  inventory:saved(INVENTORY_KEY, {}),
  category:"All",
  query:"",
  sort:"featured",
  selectedOrderId:null
};

const byId = id => document.getElementById(id);
const searchForm = byId("search-form");
const searchInput = byId("search-input");
const searchSuggestions = byId("search-suggestions");
let currentSearchSuggestions = [];
let activeSearchSuggestion = -1;
const stockOf = product => Math.max(0, state.inventory[product.id] ?? product.stock);
const stockedProducts = () => products.map(product => ({ ...product, stock:stockOf(product) }));
const save = () => {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
  localStorage.setItem(ORDER_KEY, JSON.stringify(state.orders.slice(0, 30)));
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(state.inventory));
};

function showView(name) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === `${name}-view`));
  if (name === "home") renderProducts();
  if (name === "cart") renderCart();
  if (name === "checkout") renderCheckout();
  if (name === "orders") renderOrders();
  if (name === "account") renderAccount();
  if (name === "order-detail") renderOrderDetail(state.selectedOrderId);
  window.scrollTo({ top:0, behavior:"smooth" });
}

function renderCategories() {
  byId("category-strip").innerHTML = categories
    .map(category => `<button class="${state.category === category ? "active" : ""}" data-category="${category}">${category}</button>`)
    .join("");
}

function visibleProducts() {
  let items = stockedProducts()
    .filter(product => state.category === "All" || product.category === state.category)
    .filter(product => `${product.name} ${product.category}`.toLowerCase().includes(state.query));
  if (state.sort === "price-low") items.sort((a,b) => a.price - b.price);
  if (state.sort === "price-high") items.sort((a,b) => b.price - a.price);
  if (state.sort === "rating") items.sort((a,b) => b.rating - a.rating);
  return items;
}

function renderProducts() {
  const items = visibleProducts();
  byId("catalogue-title").textContent = state.query
    ? `Results for “${state.query}”`
    : state.category === "All" ? "Popular electronics" : state.category;
  byId("product-grid").innerHTML = items.length ? items.map(product => {
    const stockClass = product.stock === 0 ? "out" : product.stock <= 2 ? "low" : "";
    const stockText = product.stock === 0 ? "Out of stock" : product.stock <= 2 ? `Only ${product.stock} left` : `${product.stock} in stock`;
    const visualClass = product.category.toLowerCase().replaceAll(" ", "-");
    const discount = Math.round((1 - product.price / product.mrp) * 100);
    return `<article class="product-card"><div class="product-visual visual-${visualClass}"><span class="offer-badge">${discount}% off</span><span class="product-device" aria-hidden="true"><b>${product.badge}</b></span></div><div class="product-info"><small>${product.category}</small><h3>${product.name}</h3><div class="rating"><span>★ ${product.rating}</span><em>Verified pick</em></div><div class="price"><strong>${money(product.price)}</strong><del>${money(product.mrp)}</del><span>${discount}% off</span></div><p class="stock ${stockClass}">${stockText}</p><button data-add="${product.id}" ${product.stock === 0 ? "disabled" : ""}>${product.stock === 0 ? "Unavailable" : "Add to cart"}</button></div></article>`;
  }).join("") : `<div class="empty">No products match this search. Try another word or category.</div>`;
}

function updateCartCount() {
  byId("cart-count").textContent = state.cart.reduce((sum,item) => sum + item.quantity, 0);
}

function addProduct(id) {
  const product = stockedProducts().find(entry => entry.id === id);
  const result = addCartItem(state.cart, product);
  if (!result.added) return;
  state.cart = result.cart;
  save();
  updateCartCount();
  const button = document.querySelector(`[data-add="${id}"]`);
  if (button) {
    button.textContent = "Added";
    setTimeout(() => { button.textContent = "Add to cart"; }, 900);
  }
}

function renderCart() {
  const container = byId("cart-items");
  const summary = byId("cart-summary");
  const currentProducts = stockedProducts();
  if (!state.cart.length) {
    container.innerHTML = `<div class="empty"><h2>Your cart is empty</h2><p>Explore products or ask Ezzie for a suggestion.</p><button class="primary" data-view="home">Browse products</button></div>`;
    summary.innerHTML = `<h2>Order summary</h2><p class="order-meta">Add a product to continue.</p>`;
    return;
  }
  container.innerHTML = state.cart.map(item => {
    const product = currentProducts.find(entry => entry.id === item.id);
    const stockWarning = product.stock < item.quantity ? `<p class="cart-warning">Only ${product.stock} available. Checkout will stop before payment.</p>` : "";
    return `<article class="cart-item"><div class="cart-thumb">${product.badge}</div><div class="cart-item-info"><h3>${product.name}</h3><p class="order-meta">${product.category} · ${money(product.price)} each · ${product.stock} available</p>${stockWarning}<div class="quantity"><button data-quantity="${item.id}" data-change="-1">−</button><strong>${item.quantity}</strong><button data-quantity="${item.id}" data-change="1">+</button><button class="remove" data-remove="${item.id}">Remove</button></div></div><strong>${money(product.price * item.quantity)}</strong></article>`;
  }).join("");
  const totals = calculateTotals(state.cart, currentProducts);
  summary.innerHTML = `<h2>Order summary</h2><div class="summary-line"><span>Subtotal</span><strong>${money(totals.subtotal)}</strong></div><div class="summary-line"><span>Delivery</span><strong>${totals.delivery ? money(totals.delivery) : "FREE"}</strong></div><div class="summary-line summary-total"><span>Total</span><span>${money(totals.total)}</span></div><p class="stock-policy">Stock is reserved at checkout and deducted only after payment succeeds.</p><button class="primary" data-view="checkout">Proceed to checkout</button>`;
}

function renderCheckout() {
  if (!state.cart.length) return showView("cart");
  const currentProducts = stockedProducts();
  const totals = calculateTotals(state.cart, currentProducts);
  byId("checkout-summary").innerHTML = `<h2>Order summary</h2>${state.cart.map(item => {
    const product = currentProducts.find(entry => entry.id === item.id);
    return `<div class="summary-line"><span>${item.quantity} × ${product.name}</span><strong>${money(product.price * item.quantity)}</strong></div>`;
  }).join("")}<div class="summary-line summary-total"><span>Total</span><span>${money(totals.total)}</span></div><p class="stock-policy">A final availability check runs before payment.</p><button class="primary" type="submit">Place demo order</button>`;
}

function orderStatusClass(order) {
  if (order.failureCode) return "failed";
  if (order.status === "Delivered") return "delivered";
  return "";
}

function renderOrders() {
  byId("orders-list").innerHTML = state.orders.length ? state.orders.map(order => {
    const current = order.milestones?.find(stage => stage.state === "CURRENT");
    const explanation = order.delivery
      ? `Estimated delivery: <strong>${order.delivery}</strong>${current ? ` · ${current.label}` : ""}`
      : order.failureCode === "STOCK_CHANGED"
        ? "Availability changed before payment, so no charge or shipment was created."
        : "Payment was not completed, so the stock hold was released and delivery did not start.";
    return `<article class="order-card"><div class="order-head"><div><h2>${order.id}</h2><p class="order-meta">Placed ${new Date(order.date).toLocaleDateString("en-IN")} · ${order.items.length} line item${order.items.length === 1 ? "" : "s"}</p></div><span class="order-status ${orderStatusClass(order)}">${order.status}</span></div><p>${explanation}</p><div class="order-card-actions"><strong>${money(order.total)}</strong><button class="outline-button" data-order-detail="${order.id}">View order journey</button></div></article>`;
  }).join("") : `<div class="empty">No orders are saved in this browser.</div>`;
}

function formatEvent(occurredAt) {
  if (!occurredAt) return "Waiting";
  return new Intl.DateTimeFormat("en-IN", { day:"numeric", month:"short", hour:"numeric", minute:"2-digit" }).format(new Date(occurredAt));
}

function renderOrderDetail(orderId) {
  const order = state.orders.find(entry => entry.id === orderId);
  if (!order) {
    byId("order-detail-card").innerHTML = `<div class="empty"><h2>Order not found</h2><button class="primary" data-view="orders">Return to orders</button></div>`;
    return;
  }
  const inventoryTitle = order.inventory.disposition === "COMMITTED" ? "Stock committed" : order.inventory.disposition === "RELEASED" ? "Reservation released" : "Reservation rejected";
  byId("order-detail-card").innerHTML = `
    <div class="order-detail-heading"><div><p class="eyebrow">ORDER ${order.id}</p><h1>${order.failureCode ? "Checkout stopped safely" : "From checkout to delivery"}</h1><p>${order.delivery ? `Estimated delivery ${order.delivery}` : "No delivery was created for this attempt."}</p></div><span class="order-status ${orderStatusClass(order)}">${order.status}</span></div>
    <div class="order-detail-grid">
      <section><h2>Order journey</h2><ol class="order-timeline">${order.milestones.map(stage => `<li class="timeline-${stage.state.toLowerCase()}"><span>${stage.state === "COMPLETED" ? "✓" : stage.state === "CURRENT" ? "●" : stage.state === "STOPPED" ? "×" : "○"}</span><div><div><strong>${stage.label}</strong><time>${formatEvent(stage.occurredAt)}</time></div><p>${stage.message}</p></div></li>`).join("")}</ol></section>
      <aside><div class="inventory-card"><p class="eyebrow">INVENTORY RESULT</p><h2>${inventoryTitle}</h2><p>${order.inventory.disposition === "COMMITTED" ? "Reserved units were assigned to this order and removed from available stock." : order.inventory.disposition === "RELEASED" ? "The stock hold was removed and availability remained unchanged." : "No units were held and payment was not attempted."}</p>${order.inventory.lines.map(line => `<article><strong>${line.name}</strong><dl><div><dt>Before</dt><dd>${line.availableBefore}</dd></div><div><dt>Held</dt><dd>${line.reserved}</dd></div><div><dt>After</dt><dd>${line.availableAfter}</dd></div></dl></article>`).join("")}</div><div class="detail-summary"><h2>Order summary</h2><p><span>Total</span><strong>${money(order.total)}</strong></p><p><span>Destination</span><strong>${order.address?.city || "Hyderabad"}</strong></p></div></aside>
    </div>`;
}

function renderAccount() {
  const currentProducts = stockedProducts();
  const available = currentProducts.filter(product => product.stock > 2).length;
  const low = currentProducts.filter(product => product.stock > 0 && product.stock <= 2).length;
  const unavailable = currentProducts.filter(product => product.stock === 0).length;
  byId("inventory-overview").innerHTML = `<h2>Catalogue availability</h2><p>Current stock in this browser reflects successful demo purchases.</p><div class="inventory-summary"><div><strong>${available}</strong><span>Available</span></div><div><strong>${low}</strong><span>Low stock</span></div><div><strong>${unavailable}</strong><span>Unavailable</span></div></div><button class="outline-button" data-view="home">Browse catalogue</button>`;
}

function commitInventory(order) {
  for (const line of order.inventory.lines) state.inventory[line.productId] = line.availableAfter;
}

function handleCheckout(form) {
  const formData = new FormData(form);
  const currentProducts = stockedProducts();
  const result = createOrder({
    cart:state.cart,
    products:currentProducts,
    address:{
      name:formData.get("name"),
      phone:formData.get("phone"),
      address:formData.get("address"),
      city:formData.get("city"),
      pincode:formData.get("pincode")
    },
    paymentOutcome:formData.get("paymentOutcome")
  });
  if (!result.order) return;
  state.orders.unshift(result.order);
  state.selectedOrderId = result.order.id;
  if (result.ok) {
    commitInventory(result.order);
    state.cart = [];
  } else if (result.code === "STOCK_CHANGED") {
    state.inventory[result.productId] = 0;
  }
  save();
  updateCartCount();
  renderProducts();
  byId("success-card").innerHTML = result.ok
    ? `<div class="success-icon">✓</div><h1>Order confirmed</h1><p>Your order number is <strong>${result.order.id}</strong>.</p><p>Estimated delivery: <strong>${result.order.delivery}</strong></p><p class="form-note">The ordered quantity has been deducted from catalogue stock.</p><button class="primary" data-order-detail="${result.order.id}">Track order journey</button>`
    : result.code === "PAYMENT_FAILED"
      ? `<div class="success-icon failure-icon">×</div><h1>Payment failed</h1><p>No money was collected. The stock hold was released automatically.</p><p>Reference <strong>${result.order.id}</strong> is saved for demonstration.</p><button class="primary" data-order-detail="${result.order.id}">View safe recovery</button>`
      : `<div class="success-icon failure-icon">×</div><h1>Item unavailable</h1><p>The final stock check stopped the order before payment.</p><p>Reference <strong>${result.order.id}</strong> is saved for demonstration.</p><button class="primary" data-order-detail="${result.order.id}">View stock conflict</button>`;
  showView("success");
}

function appendMessage(text, role, productId) {
  const element = document.createElement("div");
  element.className = `message ${role}`;
  element.textContent = text;
  if (productId) {
    const button = document.createElement("button");
    button.textContent = "Add suggestion to cart";
    button.dataset.chatAdd = productId;
    element.append(button);
  }
  byId("chat-messages").append(element);
  byId("chat-messages").scrollTop = byId("chat-messages").scrollHeight;
}

function askEzzie(text) {
  appendMessage(text, "user");
  const response = answerEzzie(text, { products:stockedProducts(), cart:state.cart, orders:state.orders });
  setTimeout(() => appendMessage(response.text, "assistant", response.productId), 180);
}

function closeSearchSuggestions() {
  currentSearchSuggestions = [];
  activeSearchSuggestion = -1;
  searchSuggestions.hidden = true;
  searchSuggestions.innerHTML = "";
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
}

function setActiveSearchSuggestion(index) {
  if (!currentSearchSuggestions.length) return;
  activeSearchSuggestion = index < 0
    ? -1
    : (index + currentSearchSuggestions.length) % currentSearchSuggestions.length;

  searchSuggestions.querySelectorAll(".search-suggestion").forEach((option, optionIndex) => {
    const isActive = optionIndex === activeSearchSuggestion;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", String(isActive));
    if (isActive) option.scrollIntoView({ block:"nearest" });
  });

  if (activeSearchSuggestion >= 0) {
    searchInput.setAttribute("aria-activedescendant", `search-option-${activeSearchSuggestion}`);
  } else {
    searchInput.removeAttribute("aria-activedescendant");
  }
}

function renderSearchSuggestions() {
  const query = searchInput.value.trim();
  if (!query) return closeSearchSuggestions();

  currentSearchSuggestions = searchProducts(query);
  activeSearchSuggestion = -1;
  searchSuggestions.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
  searchInput.removeAttribute("aria-activedescendant");

  searchSuggestions.innerHTML = currentSearchSuggestions.length
    ? currentSearchSuggestions.map((product, index) => `
      <button class="search-suggestion" id="search-option-${index}" type="button" role="option" aria-selected="false" data-search-product="${product.id}" data-search-index="${index}">
        <span><strong>${product.name}</strong><small>${product.category}</small></span>
        <b>${money(product.price)}</b>
      </button>`).join("")
    : `<div class="search-empty" role="option" aria-disabled="true" aria-selected="false"><strong>No products found</strong><span>Try another product name or category.</span></div>`;
}

function selectSearchProduct(productId) {
  const product = productById(productId);
  if (!product) return;
  searchInput.value = product.name;
  state.query = product.name.toLowerCase();
  state.category = "All";
  closeSearchSuggestions();
  showView("home");
  renderCategories();
  byId("products-section").scrollIntoView({ behavior:"smooth" });
}

document.addEventListener("click", event => {
  const target = event.target.closest("button,a");
  if (!target) return;
  if (target.dataset.view) showView(target.dataset.view);
  if (target.dataset.orderDetail) {
    state.selectedOrderId = target.dataset.orderDetail;
    showView("order-detail");
  }
  if (target.dataset.category) {
    state.category = target.dataset.category;
    state.query = "";
    searchInput.value = "";
    closeSearchSuggestions();
    showView("home");
    renderCategories();
    renderProducts();
    byId("products-section").scrollIntoView({ behavior:"smooth" });
  }
  if (target.dataset.add) addProduct(target.dataset.add);
  if (target.dataset.remove) {
    state.cart = state.cart.filter(item => item.id !== target.dataset.remove);
    save();
    updateCartCount();
    renderCart();
  }
  if (target.dataset.quantity) {
    const product = stockedProducts().find(item => item.id === target.dataset.quantity);
    const change = Number(target.dataset.change);
    state.cart = state.cart.map(item => item.id === target.dataset.quantity
      ? { ...item, quantity:Math.max(1, Math.min(Math.max(1, product.stock), item.quantity + change)) }
      : item);
    save();
    renderCart();
  }
  if (target.hasAttribute("data-scroll-products")) byId("products-section").scrollIntoView({ behavior:"smooth" });
  if (target.dataset.chatAdd) {
    addProduct(target.dataset.chatAdd);
    appendMessage("Added to your cart. You can open the cart from the header.", "assistant");
  }
});

searchInput.addEventListener("input", renderSearchSuggestions);
searchInput.addEventListener("focus", () => {
  if (searchInput.value.trim()) renderSearchSuggestions();
});
searchInput.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeSearchSuggestions();
    return;
  }

  if ((event.key === "ArrowDown" || event.key === "ArrowUp") && searchSuggestions.hidden) {
    renderSearchSuggestions();
  }

  if (!currentSearchSuggestions.length) return;

  if (event.key === "ArrowDown") {
    event.preventDefault();
    setActiveSearchSuggestion(activeSearchSuggestion + 1);
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    setActiveSearchSuggestion(activeSearchSuggestion <= 0 ? currentSearchSuggestions.length - 1 : activeSearchSuggestion - 1);
  }

  if (event.key === "Enter" && activeSearchSuggestion >= 0) {
    event.preventDefault();
    selectSearchProduct(currentSearchSuggestions[activeSearchSuggestion].id);
  }
});
searchSuggestions.addEventListener("mouseover", event => {
  const option = event.target.closest("[data-search-index]");
  if (option) setActiveSearchSuggestion(Number(option.dataset.searchIndex));
});
searchSuggestions.addEventListener("click", event => {
  const option = event.target.closest("[data-search-product]");
  if (option) selectSearchProduct(option.dataset.searchProduct);
});
document.addEventListener("pointerdown", event => {
  if (!searchForm.contains(event.target)) closeSearchSuggestions();
});

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  if (activeSearchSuggestion >= 0 && currentSearchSuggestions[activeSearchSuggestion]) {
    selectSearchProduct(currentSearchSuggestions[activeSearchSuggestion].id);
    return;
  }
  state.query = searchInput.value.trim().toLowerCase();
  state.category = "All";
  closeSearchSuggestions();
  showView("home");
  renderCategories();
  renderProducts();
  byId("products-section").scrollIntoView({ behavior:"smooth" });
});
byId("sort-select").addEventListener("change", event => { state.sort = event.target.value; renderProducts(); });
byId("checkout-form").addEventListener("submit", event => { event.preventDefault(); handleCheckout(event.currentTarget); });
byId("chat-launcher").addEventListener("click", () => { byId("chat-panel").classList.add("open"); byId("chat-panel").setAttribute("aria-hidden", "false"); byId("chat-input").focus(); });
byId("chat-close").addEventListener("click", () => { byId("chat-panel").classList.remove("open"); byId("chat-panel").setAttribute("aria-hidden", "true"); });
byId("account-chat").addEventListener("click", () => { byId("chat-panel").classList.add("open"); byId("chat-panel").setAttribute("aria-hidden", "false"); byId("chat-input").focus(); });
byId("chat-form").addEventListener("submit", event => { event.preventDefault(); const text = byId("chat-input").value.trim(); if (!text) return; byId("chat-input").value = ""; askEzzie(text); });
byId("chat-suggestions").addEventListener("click", event => { if (event.target.matches("button")) askEzzie(event.target.textContent); });

renderCategories();
renderProducts();
updateCartCount();
save();
