package in.bigtech.store.service;

import in.bigtech.store.model.OrderRequest;
import in.bigtech.store.model.OrderResponse.InventoryLine;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class InventoryService {
    private final Map<String, Integer> stock = new HashMap<>(Map.ofEntries(
            Map.entry("BT-PH-101", 8),
            Map.entry("BT-PH-103", 1),
            Map.entry("BT-LP-201", 6),
            Map.entry("BT-LP-204", 2),
            Map.entry("BT-TV-302", 2),
            Map.entry("BT-TV-304", 1),
            Map.entry("BT-AU-401", 12),
            Map.entry("BT-AP-501", 4),
            Map.entry("BT-AP-502", 3),
            Map.entry("BT-AP-503", 2),
            Map.entry("BT-WE-601", 11),
            Map.entry("BT-WE-602", 5),
            Map.entry("BT-WE-604", 3),
            Map.entry("BT-GM-701", 12),
            Map.entry("BT-GM-702", 7),
            Map.entry("BT-GM-703", 4),
            Map.entry("BT-GM-704", 2)
    ));

    public synchronized Reservation reserve(List<OrderRequest.LineItem> items) {
        boolean available = items.stream()
                .allMatch(item -> stock.getOrDefault(item.productId(), 0) >= item.quantity());
        if (!available) {
            List<InventoryLine> lines = items.stream().map(item -> {
                int before = stock.getOrDefault(item.productId(), 0);
                return new InventoryLine(item.productId(), item.quantity(), before, 0, before);
            }).toList();
            return new Reservation(null, false, lines);
        }

        List<InventoryLine> lines = items.stream().map(item -> {
            int before = stock.getOrDefault(item.productId(), 0);
            stock.put(item.productId(), before - item.quantity());
            return new InventoryLine(
                    item.productId(),
                    item.quantity(),
                    before,
                    item.quantity(),
                    before - item.quantity()
            );
        }).toList();
        return new Reservation(UUID.randomUUID().toString(), true, lines);
    }

    public synchronized List<InventoryLine> release(Reservation reservation) {
        return reservation.lines().stream().map(line -> {
            stock.put(line.productId(), stock.getOrDefault(line.productId(), 0) + line.reserved());
            return new InventoryLine(
                    line.productId(),
                    line.requested(),
                    line.availableBefore(),
                    line.reserved(),
                    line.availableBefore()
            );
        }).toList();
    }

    public List<InventoryLine> commit(Reservation reservation) {
        return reservation.lines();
    }

    public synchronized int availableStock(String productId) {
        return stock.getOrDefault(productId, 0);
    }

    public record Reservation(
            String reservationId,
            boolean accepted,
            List<InventoryLine> lines
    ) {}
}
