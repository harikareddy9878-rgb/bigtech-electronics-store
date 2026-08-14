package in.bigtech.store.agent;

import in.bigtech.store.model.OrderResponse.DeliveryMilestone;
import in.bigtech.store.model.OrderResponse.WorkflowStep;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
public class DeliveryAgent {
    private static final List<Template> TEMPLATES = List.of(
            new Template("ORDER_RECEIVED", "Order received", "The order details were validated and recorded.", 0),
            new Template("INVENTORY_RESERVED", "Items reserved", "Available units were held while payment was reviewed.", 1),
            new Template("PAYMENT_APPROVED", "Payment confirmed", "The selected payment method was approved.", 2),
            new Template("PICKING", "Picking items", "The fulfilment team is collecting the order items.", 45),
            new Template("PACKED", "Packed", "The products were checked, protected and labelled.", 180),
            new Template("SHIPPED", "Shipped", "The parcel left the fulfilment centre.", 360),
            new Template("OUT_FOR_DELIVERY", "Out for delivery", "The parcel is with the local delivery partner.", 4320),
            new Template("DELIVERED", "Delivered", "The parcel reached the delivery address.", 4740)
    );

    public DeliveryResult schedule(Instant createdAt, String pincode) {
        List<DeliveryMilestone> milestones = new ArrayList<>();
        for (int index = 0; index < TEMPLATES.size(); index++) {
            Template template = TEMPLATES.get(index);
            String state = index < 3 ? "COMPLETED" : index == 3 ? "CURRENT" : "UPCOMING";
            Instant occurredAt = index <= 3 ? createdAt : null;
            milestones.add(toMilestone(template, state, template.message(), occurredAt));
        }
        return new DeliveryResult(
                milestones,
                new WorkflowStep("Delivery Agent", "completed", "Delivery milestones were planned for " + pincode + ".")
        );
    }

    public List<DeliveryMilestone> stopped(Instant createdAt, String failureCode) {
        int stoppedIndex = "STOCK_CHANGED".equals(failureCode) ? 1 : 2;
        String failureMessage = "STOCK_CHANGED".equals(failureCode)
                ? "The requested quantity was no longer available. Payment was not attempted."
                : "Payment was declined. The temporary stock hold was released automatically.";
        List<DeliveryMilestone> milestones = new ArrayList<>();
        for (int index = 0; index < TEMPLATES.size(); index++) {
            Template template = TEMPLATES.get(index);
            if (index < stoppedIndex) {
                milestones.add(toMilestone(
                        template,
                        "COMPLETED",
                        template.message(),
                        createdAt
                ));
            } else {
                milestones.add(toMilestone(
                        template,
                        "STOPPED",
                        index == stoppedIndex ? failureMessage : "This stage was not started.",
                        index == stoppedIndex ? createdAt : null
                ));
            }
        }
        return milestones;
    }

    private DeliveryMilestone toMilestone(Template template, String state, String message, Instant occurredAt) {
        return new DeliveryMilestone(template.code(), template.label(), state, message, occurredAt);
    }

    private record Template(String code, String label, String message, long offsetMinutes) {}

    public record DeliveryResult(
            List<DeliveryMilestone> milestones,
            WorkflowStep step
    ) {}
}
