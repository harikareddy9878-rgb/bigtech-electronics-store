from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "reports" / "figures"


def bar(
    labels: list[str], values: list[float], title: str, ylabel: str, name: str
) -> None:
    plt.figure(figsize=(8.5, 4.8))
    bars = plt.bar(labels, values, color="0.72", edgecolor="black")
    plt.bar_label(bars, fmt="%.0f")
    plt.title(title)
    plt.ylabel(ylabel)
    plt.xticks(rotation=12)
    plt.tight_layout()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    plt.savefig(OUTPUT / name, dpi=180, bbox_inches="tight")
    plt.close()


def main() -> None:
    plt.style.use("grayscale")
    bar(
        ["Frontend", "Java"],
        [7, 3],
        "Automated test results",
        "Passing test cases",
        "01_test_suites.png",
    )
    bar(
        ["Products", "Categories"],
        [28, 7],
        "Catalogue coverage",
        "Count",
        "02_catalogue_coverage.png",
    )
    bar(
        ["Success", "Stock changed", "Payment failed"],
        [3, 1, 2],
        "Service decisions reached by scenario",
        "Service decisions",
        "03_order_scenarios.png",
    )
    bar(
        ["Storefront", "Cart and checkout", "Ezzie assistant"],
        [1, 1, 1],
        "Browser verification evidence",
        "Verified views",
        "04_browser_evidence.png",
    )
    bar(
        ["Inventory", "Payment", "Fulfilment", "Coordinator"],
        [1, 1, 1, 1],
        "Java service boundaries",
        "Implemented components",
        "05_backend_components.png",
    )
    print("Wrote five report figures")


if __name__ == "__main__":
    main()
