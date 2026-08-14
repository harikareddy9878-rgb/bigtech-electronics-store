package in.bigtech.store.service;

import in.bigtech.store.agent.DeliveryAgent;
import in.bigtech.store.agent.FulfilmentAgent;
import in.bigtech.store.agent.InventoryAgent;
import in.bigtech.store.agent.NotificationAgent;
import in.bigtech.store.agent.PaymentAgent;
import in.bigtech.store.model.OrderRequest;
import in.bigtech.store.model.OrderResponse;
import in.bigtech.store.model.OrderResponse.WorkflowStep;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OrderCoordinator {
    private final InventoryAgent inventoryAgent;
    private final PaymentAgent paymentAgent;
    private final FulfilmentAgent fulfilmentAgent;
    private final DeliveryAgent deliveryAgent;
    private final NotificationAgent notificationAgent;
    private final Clock clock;
    private final AtomicInteger sequence = new AtomicInteger(1000);

    public OrderCoordinator(
            InventoryAgent inventoryAgent,
            PaymentAgent paymentAgent,
            FulfilmentAgent fulfilmentAgent,
            DeliveryAgent deliveryAgent,
            NotificationAgent notificationAgent,
            Clock clock
    ) {
        this.inventoryAgent = inventoryAgent;
        this.paymentAgent = paymentAgent;
        this.fulfilmentAgent = fulfilmentAgent;
        this.deliveryAgent = deliveryAgent;
        this.notificationAgent = notificationAgent;
        this.clock = clock;
    }

    public OrderResponse place(OrderRequest request) {
        Instant createdAt = clock.instant();
        String orderId = "BIG-" + LocalDate.now(clock).toString().replace("-", "") + "-" + sequence.incrementAndGet();
        List<WorkflowStep> workflow = new ArrayList<>();

        InventoryAgent.ReservationResult inventory = inventoryAgent.reserve(request);
        workflow.add(inventory.step());
        if (!inventory.reservation().accepted()) {
            workflow.add(skipped("Payment Agent", "Payment was not attempted."));
            workflow.add(skipped("Fulfilment Agent", "Picking and packing were not started."));
            workflow.add(skipped("Delivery Agent", "No delivery journey was created."));
            workflow.add(notificationAgent.record("STOCK_CHANGED"));
            return new OrderResponse(
                    false,
                    orderId,
                    "Stock changed",
                    null,
                    "STOCK_CHANGED",
                    "REJECTED",
                    inventory.reservation().lines(),
                    deliveryAgent.stopped(createdAt, "STOCK_CHANGED"),
                    workflow
            );
        }

        PaymentAgent.PaymentResult payment = paymentAgent.authorise(request.paymentOutcome());
        workflow.add(payment.step());
        if (!payment.approved()) {
            var releasedInventory = inventoryAgent.release(inventory.reservation());
            workflow.add(skipped("Fulfilment Agent", "The inventory reservation was released."));
            workflow.add(skipped("Delivery Agent", "No delivery journey was created."));
            workflow.add(notificationAgent.record("PAYMENT_FAILED"));
            return new OrderResponse(
                    false,
                    orderId,
                    "Payment failed",
                    null,
                    "PAYMENT_FAILED",
                    "RELEASED",
                    releasedInventory,
                    deliveryAgent.stopped(createdAt, "PAYMENT_FAILED"),
                    workflow
            );
        }

        var committedInventory = inventoryAgent.commit(inventory.reservation());
        FulfilmentAgent.FulfilmentResult fulfilment = fulfilmentAgent.plan(request);
        workflow.add(fulfilment.step());
        DeliveryAgent.DeliveryResult delivery = deliveryAgent.schedule(createdAt, request.pincode());
        workflow.add(delivery.step());
        workflow.add(notificationAgent.record("SUCCESS"));
        return new OrderResponse(
                true,
                orderId,
                "Confirmed",
                fulfilment.estimatedDelivery(),
                null,
                "COMMITTED",
                committedInventory,
                delivery.milestones(),
                workflow
        );
    }

    private WorkflowStep skipped(String agent, String message) {
        return new WorkflowStep(agent, "skipped", message);
    }
}
