package in.bigtech.store.agent;

import in.bigtech.store.model.OrderRequest;
import in.bigtech.store.model.OrderResponse.InventoryLine;
import in.bigtech.store.model.OrderResponse.WorkflowStep;
import in.bigtech.store.service.InventoryService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class InventoryAgent {
    private final InventoryService inventory;

    public InventoryAgent(InventoryService inventory) {
        this.inventory = inventory;
    }

    public ReservationResult reserve(OrderRequest request) {
        InventoryService.Reservation reservation = inventory.reserve(request.items());
        WorkflowStep step = reservation.accepted()
                ? new WorkflowStep("Inventory Agent", "completed", "Requested units were reserved temporarily.")
                : new WorkflowStep("Inventory Agent", "failed", "Available quantity changed before reservation.");
        return new ReservationResult(reservation, step);
    }

    public List<InventoryLine> release(InventoryService.Reservation reservation) {
        return inventory.release(reservation);
    }

    public List<InventoryLine> commit(InventoryService.Reservation reservation) {
        return inventory.commit(reservation);
    }

    public record ReservationResult(
            InventoryService.Reservation reservation,
            WorkflowStep step
    ) {}
}
