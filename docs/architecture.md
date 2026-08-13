# Architecture

The website is a static HTML, CSS, and JavaScript application. Catalogue, cart, checkout, order history, and Ezzie run in the browser for the hosted demonstration. Local storage keeps demo state on the visitor's device.

The Java Spring Boot service implements the same order sequence through `POST /api/orders`:

1. Validate the request
2. Check inventory for every line item
3. Simulate payment authorisation
4. Calculate fulfilment date
5. Return confirmed or a specific failure code

The service does not store real customers or connect to a payment gateway. This separation lets the frontend remain deployable as a free static demo while the Java workflow stays independently testable.

## Ezzie request flow

Ezzie is a website scoped support layer. It classifies each message as product discovery, budget search, stock, cart, delivery, return, payment, order lookup, or outside scope. Product requests are resolved against the same catalogue and current stock used by the cart. Order requests are resolved against the local demonstration history. Messages outside BigTech receive a short boundary response.

This keeps the assistant explainable and deterministic for a public student project. It does not call a paid language model, send customer text to another service, or claim to provide general purpose advice.

## Deployment

The public frontend is deployed as a static Vercel project. `vercel.json` keeps route handling inside the single browser application. The Spring Boot service remains a separately runnable and testable backend because the hosted demonstration does not require a persistent database or commercial integrations.
