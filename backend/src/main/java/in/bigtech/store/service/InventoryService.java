package in.bigtech.store.service;

import in.bigtech.store.model.OrderRequest;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class InventoryService {
    private final Map<String, Integer> stock = Map.of(
            "BT-PH-101", 8,
            "BT-PH-103", 1,
            "BT-LP-201", 6,
            "BT-LP-204", 2,
            "BT-TV-302", 2,
            "BT-TV-304", 1,
            "BT-AU-401", 12,
            "BT-AP-501", 4,
            "BT-AP-502", 3,
            "BT-AP-503", 2
    );

    public boolean isAvailable(OrderRequest.LineItem item) {
        return stock.getOrDefault(item.productId(), 0) >= item.quantity();
    }
}

