package in.bigtech.store.service;

import in.bigtech.store.agent.DeliveryAgent;
import in.bigtech.store.agent.FulfilmentAgent;
import in.bigtech.store.agent.InventoryAgent;
import in.bigtech.store.agent.NotificationAgent;
import in.bigtech.store.agent.PaymentAgent;
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
    private InventoryService inventory;

    @BeforeEach
    void setup() {
        Clock clock = Clock.fixed(Instant.parse("2026-08-13T12:00:00Z"), ZoneOffset.UTC);
        inventory = new InventoryService();
        coordinator = new OrderCoordinator(
                new InventoryAgent(inventory),
                new PaymentAgent(new PaymentService()),
                new FulfilmentAgent(new FulfilmentService(clock)),
                new DeliveryAgent(),
                new NotificationAgent(),
                clock
        );
    }

    @Test
    void confirmsAvailableOrder() {
        OrderRequest request = new OrderRequest(List.of(new OrderRequest.LineItem("BT-PH-101", 1)), "Harika", "500081", "SUCCESS");
        OrderResponse response = coordinator.place(request);
        assertThat(response.accepted()).isTrue();
        assertThat(response.status()).isEqualTo("Confirmed");
        assertThat(response.estimatedDelivery()).isEqualTo("2026-08-15");
        assertThat(response.inventoryDisposition()).isEqualTo("COMMITTED");
        assertThat(response.inventory().get(0).availableAfter()).isEqualTo(7);
        assertThat(inventory.availableStock("BT-PH-101")).isEqualTo(7);
        assertThat(response.workflow()).hasSize(5).allMatch(step -> step.status().equals("completed"));
    }

    @Test
    void rejectsUnavailableQuantityBeforePayment() {
        OrderRequest request = new OrderRequest(List.of(new OrderRequest.LineItem("BT-PH-103", 2)), "Harika", "500081", "SUCCESS");
        OrderResponse response = coordinator.place(request);
        assertThat(response.accepted()).isFalse();
        assertThat(response.failureCode()).isEqualTo("STOCK_CHANGED");
        assertThat(response.inventoryDisposition()).isEqualTo("REJECTED");
        assertThat(response.inventory().get(0).reserved()).isZero();
    }

    @Test
    void recordsPaymentFailureWithoutDeliveryDate() {
        OrderRequest request = new OrderRequest(List.of(new OrderRequest.LineItem("BT-LP-201", 1)), "Harika", "500081", "FAILURE");
        OrderResponse response = coordinator.place(request);
        assertThat(response.accepted()).isFalse();
        assertThat(response.failureCode()).isEqualTo("PAYMENT_FAILED");
        assertThat(response.estimatedDelivery()).isNull();
        assertThat(response.inventoryDisposition()).isEqualTo("RELEASED");
        assertThat(inventory.availableStock("BT-LP-201")).isEqualTo(6);
    }

    @Test
    void createsAnEightStageDeliveryTimeline() {
        OrderRequest request = new OrderRequest(List.of(new OrderRequest.LineItem("BT-AU-401", 1)), "Harika", "500081", "SUCCESS");
        OrderResponse response = coordinator.place(request);

        assertThat(response.milestones()).hasSize(8);
        assertThat(response.milestones().get(3).code()).isEqualTo("PICKING");
        assertThat(response.milestones().get(3).state()).isEqualTo("CURRENT");
        assertThat(response.milestones().get(7).code()).isEqualTo("DELIVERED");
    }
}
