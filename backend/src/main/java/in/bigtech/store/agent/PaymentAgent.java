package in.bigtech.store.agent;

import in.bigtech.store.model.OrderResponse.WorkflowStep;
import in.bigtech.store.service.PaymentService;
import org.springframework.stereotype.Component;

@Component
public class PaymentAgent {
    private final PaymentService payment;

    public PaymentAgent(PaymentService payment) {
        this.payment = payment;
    }

    public PaymentResult authorise(String outcome) {
        boolean approved = payment.authorise(outcome);
        WorkflowStep step = approved
                ? new WorkflowStep("Payment Agent", "completed", "The simulated payment was authorised.")
                : new WorkflowStep("Payment Agent", "failed", "The simulated payment was declined.");
        return new PaymentResult(approved, step);
    }

    public record PaymentResult(boolean approved, WorkflowStep step) {}
}
