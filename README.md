# BigTech Electronics Store

BigTech is a compact Indian electronics shopping website covering product discovery, cart management, simulated checkout, payment outcomes, order tracking, and conversational support from Ezzie.

![BigTech storefront](evidence/bigtech_storefront.png)

## Problem

An online electronics purchase involves more than a product grid. Stock must be checked before payment, delivery depends on the pincode and item category, payment can fail, and a customer needs a clear order status after checkout.

## Purpose

This project demonstrates an end-to-end retail flow with a responsive frontend and a Java Spring Boot service. The live static demo uses the same deterministic browser rules when the Java service is unavailable, while the backend can be run locally for REST API testing.

## What it includes

The catalogue contains phones, laptops, televisions, audio products, and home appliances with Indian Rupee prices. Customers can search, filter, add available products, update quantities, complete a simulated payment, view recent orders, and ask Ezzie for product, delivery, return, or order help.

The Java service coordinates inventory validation, payment simulation, and fulfilment estimates. Failure scenarios return explicit codes instead of pretending every order succeeds.

## Repository guide

| Folder | Contents |
| --- | --- |
| `public` | HTML, CSS, JavaScript, products, and browser demo |
| `backend` | Spring Boot order API and service tests |
| `tests` | Frontend unit tests |
| `evidence` | Verified website screenshots |
| `reports` | Detailed PDF project report |
| `docs` | Architecture and scenario notes |

## Run the website

```bash
npm install
npm run serve
```

Open `http://localhost:3000`.

## Run the Java service

```bash
cd backend
./mvnw test
./mvnw spring-boot:run
```

The service runs at `http://localhost:8080`.

## Test

```bash
npm test
cd backend && ./mvnw test
```

Payments, orders, inventory, and delivery dates are simulated for demonstration. No real payment is collected.

## Author

Harika

