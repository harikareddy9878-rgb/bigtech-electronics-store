package in.bigtech.store.service;

import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    public boolean authorise(String requestedOutcome) {
        return "SUCCESS".equalsIgnoreCase(requestedOutcome);
    }
}

