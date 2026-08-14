# BigTech architecture

## 1. Design goal

BigTech separates the customer shopping experience from the technical order workflow. Customers see familiar product, checkout, order and delivery language. The repository keeps the internal agent decisions, inventory evidence and failure paths available for inspection and testing.

## 2. Runtime components

| Component | Responsibility |
| --- | --- |
| Browser storefront | Catalogue, search, cart, checkout, account, orders and Ezzie |
| Versioned local storage | Personal cart, order history and per browser stock changes |
| Order Coordinator | Controls the required sequence and stops unsafe downstream work |
| Inventory Agent | Checks quantity and returns a reservation result |
| Payment Agent | Produces an approved or declined simulated payment result |
| Fulfilment Agent | Calculates the delivery estimate and plans picking and packing |
| Delivery Agent | Creates eight typed customer milestones |
| Notification Agent | Records the final outcome message |

The static Vercel application executes a contract compatible JavaScript workflow. The Spring Boot implementation provides the same decisions through `POST /api/orders` and remains independently runnable.

## 3. Order contract

An order request contains line items, customer name, six digit pincode and the selected payment outcome. The response contains:

1. Accepted flag, order number and customer status
2. Delivery estimate when fulfilment exists
3. Failure code when processing stops
4. Inventory disposition and per item quantity snapshot
5. Eight delivery milestones with completed, current, upcoming or stopped state
6. Internal workflow steps for technical evidence

The storefront never uses internal workflow names as customer navigation. It renders the milestone and inventory fields using normal retail language.

## 4. Successful order sequence

```text
Checkout request
      |
      v
Inventory Agent reserves every requested unit
      |
      v
Payment Agent approves the simulation
      |
      v
Inventory reservation is committed
      |
      v
Fulfilment Agent plans picking, packing and delivery date
      |
      v
Delivery Agent creates the eight stage timeline
      |
      v
Notification Agent saves confirmation and tracking
```

The inventory snapshot records the quantity available before reservation, the quantity held and the quantity available after commit. The browser persists the after value and refreshes product cards immediately.

## 5. Payment failure sequence

```text
Inventory reserved
      |
      v
Payment declined
      |
      v
Reservation released
      |
      +--> Fulfilment skipped
      +--> Delivery skipped
      +--> Failure saved in order history
```

The released response returns the same before and after quantity. The cart remains available, no delivery estimate is created, and later milestones show a stopped state.

## 6. Stock conflict sequence

```text
Final quantity check fails
      |
      +--> Reservation rejected
      +--> Payment not attempted
      +--> Fulfilment not started
      +--> Delivery not created
      +--> Attempt saved for explanation
```

This branch represents another shopper taking the last unit between cart review and checkout. It is deliberately available as a checkout demonstration so the failure path can be reproduced.

## 7. Inventory state model

| State | Meaning | Next state |
| --- | --- | --- |
| Available | Quantity can be selected | Reserved or rejected |
| Reserved | Units are held during payment | Committed or released |
| Committed | Confirmed order owns the units | Terminal for the order |
| Released | Payment failed and units returned | Available |
| Rejected | Requested quantity could not be held | Terminal for the attempt |

`InventoryService.reserve` validates every line before changing any quantity. This prevents a partial reservation when one cart item is unavailable. Its synchronized methods make the demonstration state transition atomic inside one service process.

## 8. Delivery lifecycle

The delivery contract has eight stages.

1. Order received
2. Items reserved
3. Payment confirmed
4. Picking items
5. Packed
6. Shipped
7. Out for delivery
8. Delivered

Confirmed orders begin with picking as the current stage. Public examples show shipped, out for delivery and delivered states. Failure branches stop at inventory or payment and explicitly prevent every later stage.

## 9. Ezzie boundary

Ezzie classifies a message as product discovery, budget search, cart, inventory, delivery, return, payment, order lookup, account or outside scope. Product answers resolve against the current stock map. Order answers resolve against the same saved timeline used by the order detail screen.

The assistant is deterministic, website scoped and does not send customer messages to a third party. This makes the support behavior reproducible and prevents invented prices or order dates.

## 10. Data and persistence

The catalogue contains 28 synthetic products across seven categories. Versioned browser keys isolate the current schema for cart, orders and stock. Five public order examples make delivered, out for delivery, shipped, payment failed and stock changed behavior visible on a first visit.

Browser storage is not presented as a production database or warehouse inventory system. It is a safe way to demonstrate connected state in a public portfolio project.

## 11. Verification

The JavaScript suite contains ten tests for cart limits, totals, payment recovery, inventory commitment, stock rejection, delivery milestones, catalogue coverage and Ezzie boundaries. The Java suite contains four tests for commit, release, rejection and the eight stage timeline.

Browser verification covers search, cart, successful checkout, persisted stock, failed payment, stock conflict, order detail and Ezzie order lookup.

## 12. Deployment boundary

Vercel hosts the static customer application. The Spring Boot service runs locally or on a separate Java capable host. No API secret is required for the public storefront. Real commerce use would require shared persistence, authentication, a payment provider, idempotency, reservation expiry, courier integration and operational monitoring.
