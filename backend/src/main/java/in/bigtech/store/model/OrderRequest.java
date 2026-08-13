package in.bigtech.store.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record OrderRequest(
        @NotEmpty List<@Valid LineItem> items,
        @NotBlank String customerName,
        @Pattern(regexp = "[0-9]{6}") String pincode,
        @NotBlank String paymentOutcome
) {
    public record LineItem(@NotBlank String productId, @Positive int quantity) {}
}

