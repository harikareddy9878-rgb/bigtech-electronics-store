package in.bigtech.store.service;

import in.bigtech.store.model.OrderRequest;
import in.bigtech.store.model.OrderResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class OrderCoordinatorTest {
    private OrderCoordinator coordinator;

    @BeforeEach
    void setup() {
        Clock clock = Clock.fixed(Instant.parse("2026-08-13T12:00:00Z"), ZoneOffset.UTC);
        coordinator = new OrderCoordinator(new InventoryService(), new PaymentService(), new FulfilmentService(clock), clock);
    }

    @Test
    void confirmsAvailableOrder() {
        OrderRequest request = new OrderRequest(List.of(new OrderRequest.LineItem("BT-PH-101", 1)), "Harika", "500081", "SUCCESS");
        OrderResponse response = coordinator.place(request);
        assertThat(response.accepted()).isTrue();
        assertThat(response.status()).isEqualTo("Confirmed");
        assertThat(response.estimatedDelivery()).isEqualTo("2026-08-15");
    }

    @Test
    void rejectsUnavailableQuantityBeforePayment() {
        OrderRequest request = new OrderRequest(List.of(new OrderRequest.LineItem("BT-PH-103", 2)), "Harika", "500081", "SUCCESS");
        OrderResponse response = coordinator.place(request);
        assertThat(response.accepted()).isFalse();
        assertThat(response.failureCode()).isEqualTo("STOCK_CHANGED");
    }

    @Test
    void recordsPaymentFailureWithoutDeliveryDate() {
        OrderRequest request = new OrderRequest(List.of(new OrderRequest.LineItem("BT-LP-201", 1)), "Harika", "500081", "FAILURE");
        OrderResponse response = coordinator.place(request);
        assertThat(response.accepted()).isFalse();
        assertThat(response.failureCode()).isEqualTo("PAYMENT_FAILED");
        assertThat(response.estimatedDelivery()).isNull();
    }
}

