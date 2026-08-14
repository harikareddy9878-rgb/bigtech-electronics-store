package in.bigtech.store.model;

import java.time.LocalDate;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        boolean accepted,
        String orderId,
        String status,
        LocalDate estimatedDelivery,
        String failureCode,
        String inventoryDisposition,
        List<InventoryLine> inventory,
        List<DeliveryMilestone> milestones,
        List<WorkflowStep> workflow
) {
    public record InventoryLine(
            String productId,
            int requested,
            int availableBefore,
            int reserved,
            int availableAfter
    ) {}

    public record DeliveryMilestone(
            String code,
            String label,
            String state,
            String message,
            Instant occurredAt
    ) {}

    public record WorkflowStep(
            String agent,
            String status,
            String message
    ) {}
}
