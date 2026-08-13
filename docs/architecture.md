# Architecture

The website is a static HTML, CSS, and JavaScript application. Catalogue, cart, checkout, order history, and Ezzie run in the browser for the hosted demonstration. Local storage keeps demo state on the visitor's device.

The Java Spring Boot service implements the same order sequence through `POST /api/orders`:

1. Validate the request
2. Check inventory for every line item
3. Simulate payment authorisation
4. Calculate fulfilment date
5. Return confirmed or a specific failure code

The service does not store real customers or connect to a payment gateway. This separation lets the frontend remain deployable as a free static demo while the Java workflow stays independently testable.

