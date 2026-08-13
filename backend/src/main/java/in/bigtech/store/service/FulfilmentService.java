package in.bigtech.store.service;

import in.bigtech.store.model.OrderRequest;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;

@Service
public class FulfilmentService {
    private final Clock clock;

    public FulfilmentService(Clock clock) {
        this.clock = clock;
    }

    public LocalDate estimate(OrderRequest request) {
        boolean largeItem = request.items().stream().anyMatch(item -> item.productId().startsWith("BT-TV") || item.productId().startsWith("BT-AP"));
        int days = largeItem ? 4 : 2;
        return LocalDate.now(clock).plusDays(days);
    }
}

