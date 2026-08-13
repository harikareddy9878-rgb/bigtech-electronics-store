import { categories, products } from "./products.js";
import { addCartItem, answerEzzie, calculateTotals, createOrder, money } from "./store.js";

const state = {
  cart: JSON.parse(localStorage.getItem("bigtech-cart") || "[]"),
  orders: JSON.parse(localStorage.getItem("bigtech-orders") || "null") || [
    { id:"BIG-DEMO-731902", status:"Shipped", date:"2026-08-11T10:30:00.000Z", delivery:"15 Aug 2026", total:6999, items:[{ id:"BT-AU-401", quantity:1 }] },
    { id:"BIG-DEMO-185420", status:"Payment failed", date:"2026-08-09T14:15:00.000Z", total:52990, items:[{ id:"BT-LP-201", quantity:1 }] }
  ],
  category:"All", query:"", sort:"featured"
};

const byId = id => document.getElementById(id);
const save = () => { localStorage.setItem("bigtech-cart", JSON.stringify(state.cart)); localStorage.setItem("bigtech-orders", JSON.stringify(state.orders)); };

function showView(name) {
  document.querySelectorAll(".view").forEach(view => view.classList.toggle("active", view.id === `${name}-view`));
  if (name === "cart") renderCart();
  if (name === "checkout") renderCheckout();
  if (name === "orders") renderOrders();
  window.scrollTo({ top:0, behavior:"smooth" });
}

function renderCategories() {
  byId("category-strip").innerHTML = categories.map(category => `<button class="${state.category === category ? "active" : ""}" data-category="${category}">${category}</button>`).join("");
}

function visibleProducts() {
  let items = products.filter(product => state.category === "All" || product.category === state.category).filter(product => `${product.name} ${product.category}`.toLowerCase().includes(state.query));
  if (state.sort === "price-low") items.sort((a,b) => a.price - b.price);
  if (state.sort === "price-high") items.sort((a,b) => b.price - a.price);
  if (state.sort === "rating") items.sort((a,b) => b.rating - a.rating);
  return items;
}

function renderProducts() {
  const items = visibleProducts();
  byId("catalogue-title").textContent = state.query ? `Results for “${state.query}”` : state.category === "All" ? "Popular electronics" : state.category;
  byId("product-grid").innerHTML = items.length ? items.map(product => {
    const stockClass = product.stock === 0 ? "out" : product.stock <= 2 ? "low" : "";
    const stockText = product.stock === 0 ? "Out of stock" : product.stock <= 2 ? `Only ${product.stock} left` : "In stock";
    return `<article class="product-card"><div class="product-visual"><span>${product.badge}</span></div><div class="product-info"><small>${product.category}</small><h3>${product.name}</h3><div class="rating">★ ${product.rating}</div><div class="price"><strong>${money(product.price)}</strong><del>${money(product.mrp)}</del></div><p class="stock ${stockClass}">${stockText}</p><button data-add="${product.id}" ${product.stock === 0 ? "disabled" : ""}>${product.stock === 0 ? "Unavailable" : "Add to cart"}</button></div></article>`;
  }).join("") : `<div class="empty">No products match this search. Try another word or category.</div>`;
}

function updateCartCount() {
  byId("cart-count").textContent = state.cart.reduce((sum,item) => sum + item.quantity, 0);
}

function addProduct(id) {
  const result = addCartItem(state.cart, products.find(product => product.id === id));
  if (!result.added) return;
  state.cart = result.cart; save(); updateCartCount();
  const button = document.querySelector(`[data-add="${id}"]`);
  if (button) { button.textContent = "Added"; setTimeout(() => button.textContent = "Add to cart", 900); }
}

function renderCart() {
  const container = byId("cart-items");
  const summary = byId("cart-summary");
  if (!state.cart.length) { container.innerHTML = `<div class="empty"><h2>Your cart is empty</h2><p>Explore products or ask Ezzie for a suggestion.</p><button class="primary" data-view="home">Browse products</button></div>`; summary.innerHTML = `<h2>Order summary</h2><p class="order-meta">Add a product to continue.</p>`; return; }
  container.innerHTML = state.cart.map(item => { const product = products.find(entry => entry.id === item.id); return `<article class="cart-item"><div class="cart-thumb">${product.badge}</div><div class="cart-item-info"><h3>${product.name}</h3><p class="order-meta">${product.category} · ${money(product.price)} each</p><div class="quantity"><button data-quantity="${item.id}" data-change="-1">−</button><strong>${item.quantity}</strong><button data-quantity="${item.id}" data-change="1">+</button><button class="remove" data-remove="${item.id}">Remove</button></div></div><strong>${money(product.price * item.quantity)}</strong></article>`; }).join("");
  const totals = calculateTotals(state.cart, products);
  summary.innerHTML = `<h2>Order summary</h2><div class="summary-line"><span>Subtotal</span><strong>${money(totals.subtotal)}</strong></div><div class="summary-line"><span>Delivery</span><strong>${totals.delivery ? money(totals.delivery) : "FREE"}</strong></div><div class="summary-line summary-total"><span>Total</span><span>${money(totals.total)}</span></div><button class="primary" data-view="checkout">Proceed to checkout</button>`;
}

function renderCheckout() {
  if (!state.cart.length) return showView("cart");
  const totals = calculateTotals(state.cart, products);
  byId("checkout-summary").innerHTML = `<h2>Order summary</h2>${state.cart.map(item => { const product = products.find(entry => entry.id === item.id); return `<div class="summary-line"><span>${item.quantity} × ${product.name}</span><strong>${money(product.price * item.quantity)}</strong></div>`; }).join("")}<div class="summary-line summary-total"><span>Total</span><span>${money(totals.total)}</span></div><button class="primary" type="submit">Place demo order</button>`;
}

function renderOrders() {
  byId("orders-list").innerHTML = state.orders.length ? state.orders.map(order => `<article class="order-card"><div class="order-head"><div><h2>${order.id}</h2><p class="order-meta">Placed ${new Date(order.date).toLocaleDateString("en-IN")} · ${order.items.length} line item${order.items.length === 1 ? "" : "s"}</p></div><span class="order-status ${order.status === "Payment failed" ? "failed" : ""}">${order.status}</span></div><p>${order.delivery ? `Estimated delivery: <strong>${order.delivery}</strong>` : "Payment was not completed, so fulfilment did not start."}</p><strong>${money(order.total)}</strong></article>`).join("") : `<div class="empty">No orders are saved in this browser.</div>`;
}

function handleCheckout(form) {
  const formData = new FormData(form);
  const result = createOrder({ cart:state.cart, products, address:{ name:formData.get("name"), phone:formData.get("phone"), address:formData.get("address"), city:formData.get("city"), pincode:formData.get("pincode") }, paymentOutcome:formData.get("paymentOutcome") });
  if (result.code === "STOCK_CHANGED") { alert("Stock changed before checkout. Please review your cart."); return showView("cart"); }
  state.orders.unshift(result.order);
  if (result.ok) state.cart = [];
  save(); updateCartCount();
  byId("success-card").innerHTML = result.ok ? `<div class="success-icon">✓</div><h1>Order confirmed</h1><p>Your order number is <strong>${result.order.id}</strong>.</p><p>Estimated delivery: <strong>${result.order.delivery}</strong></p><button class="primary" data-view="orders">View my orders</button>` : `<div class="success-icon" style="background:#feefed;color:#b42318">×</div><h1>Payment failed</h1><p>No money was collected. Reference <strong>${result.order.id}</strong> is saved for demonstration.</p><button class="primary" data-view="cart">Try checkout again</button>`;
  showView("success");
}

function appendMessage(text, role, productId) {
  const element = document.createElement("div"); element.className = `message ${role}`; element.textContent = text;
  if (productId) { const button = document.createElement("button"); button.textContent = "Add suggestion to cart"; button.dataset.chatAdd = productId; element.append(button); }
  byId("chat-messages").append(element); byId("chat-messages").scrollTop = byId("chat-messages").scrollHeight;
}

function askEzzie(text) {
  appendMessage(text,"user");
  const response = answerEzzie(text, { products, cart:state.cart, orders:state.orders });
  setTimeout(() => appendMessage(response.text,"assistant",response.productId), 180);
}

document.addEventListener("click", event => {
  const target = event.target.closest("button,a"); if (!target) return;
  if (target.dataset.view) showView(target.dataset.view);
  if (target.dataset.category) { state.category = target.dataset.category; state.query = ""; byId("search-input").value = ""; renderCategories(); renderProducts(); }
  if (target.dataset.add) addProduct(target.dataset.add);
  if (target.dataset.remove) { state.cart = state.cart.filter(item => item.id !== target.dataset.remove); save(); updateCartCount(); renderCart(); }
  if (target.dataset.quantity) { const product = products.find(item => item.id === target.dataset.quantity); const change = Number(target.dataset.change); state.cart = state.cart.map(item => item.id === target.dataset.quantity ? { ...item, quantity:Math.max(1,Math.min(product.stock,item.quantity + change)) } : item); save(); renderCart(); }
  if (target.hasAttribute("data-scroll-products")) byId("products-section").scrollIntoView({ behavior:"smooth" });
  if (target.dataset.chatAdd) { addProduct(target.dataset.chatAdd); appendMessage("Added to your cart. You can open the cart from the header.","assistant"); }
});

byId("search-form").addEventListener("submit", event => { event.preventDefault(); state.query = byId("search-input").value.trim().toLowerCase(); state.category = "All"; renderCategories(); renderProducts(); byId("products-section").scrollIntoView({ behavior:"smooth" }); });
byId("sort-select").addEventListener("change", event => { state.sort = event.target.value; renderProducts(); });
byId("checkout-form").addEventListener("submit", event => { event.preventDefault(); handleCheckout(event.currentTarget); });
byId("chat-launcher").addEventListener("click", () => { byId("chat-panel").classList.add("open"); byId("chat-panel").setAttribute("aria-hidden","false"); byId("chat-input").focus(); });
byId("chat-close").addEventListener("click", () => { byId("chat-panel").classList.remove("open"); byId("chat-panel").setAttribute("aria-hidden","true"); });
byId("account-chat").addEventListener("click", () => { byId("chat-panel").classList.add("open"); byId("chat-panel").setAttribute("aria-hidden","false"); byId("chat-input").focus(); });
byId("chat-form").addEventListener("submit", event => { event.preventDefault(); const text = byId("chat-input").value.trim(); if (!text) return; byId("chat-input").value = ""; askEzzie(text); });
byId("chat-suggestions").addEventListener("click", event => { if (event.target.matches("button")) askEzzie(event.target.textContent); });

renderCategories(); renderProducts(); updateCartCount(); save();
