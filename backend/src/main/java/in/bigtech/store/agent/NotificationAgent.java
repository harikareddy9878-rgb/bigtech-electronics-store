package in.bigtech.store.agent;

import in.bigtech.store.model.OrderResponse.WorkflowStep;
import org.springframework.stereotype.Component;

@Component
public class NotificationAgent {
    public WorkflowStep record(String outcome) {
        String message = switch (outcome) {
            case "STOCK_CHANGED" -> "The stock conflict was saved in order history.";
            case "PAYMENT_FAILED" -> "The payment failure was saved in order history.";
            default -> "Confirmation and tracking were saved in order history.";
        };
        return new WorkflowStep("Notification Agent", "completed", message);
    }
}
