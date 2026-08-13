package in.bigtech.store.service;

import in.bigtech.store.model.OrderRequest;
import in.bigtech.store.model.OrderResponse;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OrderCoordinator {
    private final InventoryService inventory;
    private final PaymentService payment;
    private final FulfilmentService fulfilment;
    private final Clock clock;
    private final AtomicInteger sequence = new AtomicInteger(1000);

    public OrderCoordinator(InventoryService inventory, PaymentService payment, FulfilmentService fulfilment, Clock clock) {
        this.inventory = inventory;
        this.payment = payment;
        this.fulfilment = fulfilment;
        this.clock = clock;
    }

    public OrderResponse place(OrderRequest request) {
        String orderId = "BIG-" + java.time.LocalDate.now(clock).toString().replace("-", "") + "-" + sequence.incrementAndGet();
        boolean available = request.items().stream().allMatch(inventory::isAvailable);
        if (!available) {
            return new OrderResponse(false, orderId, "Rejected", null, List.of("Request received", "Inventory check failed"), "STOCK_CHANGED");
        }
        if (!payment.authorise(request.paymentOutcome())) {
            return new OrderResponse(false, orderId, "Payment failed", null, List.of("Request received", "Inventory available", "Payment not authorised"), "PAYMENT_FAILED");
        }
        return new OrderResponse(true, orderId, "Confirmed", fulfilment.estimate(request), List.of("Request received", "Inventory reserved", "Payment authorised", "Fulfilment scheduled"), null);
    }
}

