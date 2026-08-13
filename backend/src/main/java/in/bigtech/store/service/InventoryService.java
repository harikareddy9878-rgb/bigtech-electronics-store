package in.bigtech.store.service;

import in.bigtech.store.model.OrderRequest;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class InventoryService {
    private final Map<String, Integer> stock = Map.ofEntries(
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
    );

    public boolean isAvailable(OrderRequest.LineItem item) {
        return stock.getOrDefault(item.productId(), 0) >= item.quantity();
    }
}
