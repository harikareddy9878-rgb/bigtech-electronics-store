package in.bigtech.store.agent;

import in.bigtech.store.model.OrderRequest;
import in.bigtech.store.model.OrderResponse.WorkflowStep;
import in.bigtech.store.service.FulfilmentService;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class FulfilmentAgent {
    private final FulfilmentService fulfilment;

    public FulfilmentAgent(FulfilmentService fulfilment) {
        this.fulfilment = fulfilment;
    }

    public FulfilmentResult plan(OrderRequest request) {
        return new FulfilmentResult(
                fulfilment.estimate(request),
                new WorkflowStep("Fulfilment Agent", "completed", "Picking and packing were scheduled.")
        );
    }

    public record FulfilmentResult(LocalDate estimatedDelivery, WorkflowStep step) {}
}
