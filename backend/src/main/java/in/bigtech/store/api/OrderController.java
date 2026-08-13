package in.bigtech.store.api;

import in.bigtech.store.model.OrderRequest;
import in.bigtech.store.model.OrderResponse;
import in.bigtech.store.service.OrderCoordinator;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {
    private final OrderCoordinator coordinator;

    public OrderController(OrderCoordinator coordinator) {
        this.coordinator = coordinator;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> place(@Valid @RequestBody OrderRequest request) {
        OrderResponse response = coordinator.place(request);
        return response.accepted() ? ResponseEntity.ok(response) : ResponseEntity.unprocessableEntity().body(response);
    }
}

