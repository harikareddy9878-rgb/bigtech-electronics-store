package in.bigtech.store.model;

import java.time.LocalDate;
import java.util.List;

public record OrderResponse(
        boolean accepted,
        String orderId,
        String status,
        LocalDate estimatedDelivery,
        List<String> events,
        String failureCode
) {}

