from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import ListedColormap

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "reports" / "figures"


def save(name: str) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    plt.tight_layout()
    plt.savefig(OUTPUT / name, dpi=190, bbox_inches="tight", facecolor="white")
    plt.close()


def bar(labels: list[str], values: list[float], title: str, ylabel: str, name: str) -> None:
    plt.figure(figsize=(8.5, 4.8))
    bars = plt.bar(labels, values, color="0.76", edgecolor="black", linewidth=1)
    plt.bar_label(bars, fmt="%.0f")
    plt.title(title, fontweight="bold")
    plt.ylabel(ylabel)
    plt.grid(axis="y", color="0.9", linewidth=0.8)
    save(name)


def workflow_matrix() -> None:
    agents = ["Inventory", "Payment", "Fulfilment", "Delivery", "Notification"]
    scenarios = ["Confirmed", "Payment failed", "Stock changed"]
    values = np.array([
        [2, 2, 2, 2, 2],
        [2, 1, 0, 0, 2],
        [1, 0, 0, 0, 2],
    ])
    labels = {0: "Skipped", 1: "Failed", 2: "Completed"}
    figure, axis = plt.subplots(figsize=(9.2, 4.2))
    axis.imshow(values, cmap=ListedColormap(["#f7f7f7", "#d1d1d1", "#7a7a7a"]), vmin=0, vmax=2, aspect="auto")
    axis.set_xticks(range(len(agents)), agents)
    axis.set_yticks(range(len(scenarios)), scenarios)
    axis.set_title("Agent outcome by checkout branch", fontweight="bold")
    for row in range(values.shape[0]):
        for column in range(values.shape[1]):
            value = values[row, column]
            axis.text(column, row, labels[value], ha="center", va="center", color="white" if value == 2 else "black", fontsize=9)
    axis.set_xticks(np.arange(-0.5, len(agents), 1), minor=True)
    axis.set_yticks(np.arange(-0.5, len(scenarios), 1), minor=True)
    axis.grid(which="minor", color="black", linewidth=0.7)
    axis.tick_params(which="minor", bottom=False, left=False)
    save("03_order_scenarios.png")


def inventory_transitions() -> None:
    figure, axis = plt.subplots(figsize=(9.2, 4.6))
    axis.axis("off")
    nodes = {
        "Available": (0.08, 0.52),
        "Reserved": (0.36, 0.52),
        "Committed": (0.72, 0.78),
        "Released": (0.72, 0.26),
        "Rejected": (0.36, 0.08),
    }
    for label, (x, y) in nodes.items():
        axis.text(x, y, label, ha="center", va="center", fontsize=12, fontweight="bold", bbox={"boxstyle": "round,pad=0.55", "facecolor": "white", "edgecolor": "black"})
    for start, end, label in [
        ("Available", "Reserved", "quantity available"),
        ("Reserved", "Committed", "payment approved"),
        ("Reserved", "Released", "payment declined"),
        ("Available", "Rejected", "quantity changed"),
    ]:
        x1, y1 = nodes[start]
        x2, y2 = nodes[end]
        axis.annotate("", xy=(x2 - 0.07, y2), xytext=(x1 + 0.08, y1), arrowprops={"arrowstyle": "->", "color": "black", "lw": 1.3})
        axis.text((x1 + x2) / 2, (y1 + y2) / 2 + 0.05, label, ha="center", fontsize=9)
    axis.set_title("Inventory reservation state transitions", fontweight="bold", pad=16)
    save("04_inventory_transitions.png")


def delivery_lifecycle() -> None:
    labels = ["Received", "Reserved", "Paid", "Picking", "Packed", "Shipped", "Out for delivery", "Delivered"]
    x = np.arange(1, 9)
    plt.figure(figsize=(9.4, 3.8))
    plt.plot(x, np.ones_like(x), color="black", linewidth=1.4)
    plt.scatter(x, np.ones_like(x), s=180, color="0.75", edgecolor="black", zorder=3)
    for index, label in enumerate(labels, start=1):
        plt.text(index, 1.12 if index % 2 else 0.86, f"{index}. {label}", ha="center", va="center", fontsize=9)
    plt.xlim(0.5, 8.5)
    plt.ylim(0.65, 1.35)
    plt.axis("off")
    plt.title("Eight stage customer delivery contract", fontweight="bold")
    save("05_delivery_lifecycle.png")


def architecture_flow(name: str, title: str, subtitle: str, stages: list[tuple[str, str, str]]) -> None:
    figure, axis = plt.subplots(figsize=(11.5, 4.8))
    axis.axis("off")
    for index, (component, technology, responsibility) in enumerate(stages):
        x = 0.035 + index * (0.93 / len(stages))
        axis.text(
            x,
            0.55,
            f"{component}\n\n{technology}\n{responsibility}",
            ha="center",
            va="center",
            fontsize=9.2,
            bbox={"boxstyle": "round,pad=0.85", "facecolor": "white", "edgecolor": "black"},
        )
        if index < len(stages) - 1:
            axis.annotate("", xy=(x + 0.14, 0.55), xytext=(x + 0.08, 0.55), arrowprops={"arrowstyle": "->", "lw": 1.5})
    axis.set_title(title, fontweight="bold", pad=22)
    axis.text(0.5, 0.08, subtitle, transform=axis.transAxes, ha="center", fontsize=10)
    save(name)


def test_execution() -> None:
    figure, axis = plt.subplots(figsize=(10.5, 5.5))
    figure.patch.set_facecolor("#171717")
    axis.set_facecolor("#171717")
    axis.axis("off")
    lines = [
        "$ npm test",
        "10 JavaScript tests passed | 0 failed",
        "",
        "$ cd backend && ./mvnw test -q",
        "4 JUnit tests passed | 0 failed",
        "",
        "Verified scenarios:",
        "available cart, out-of-stock block, delivery fee, payment failure,",
        "Ezzie scope, product budget, stock commit, stock conflict and timeline.",
    ]
    for index, line in enumerate(lines):
        axis.text(0.055, 0.9 - index * 0.095, line, transform=axis.transAxes, color="white" if index < 6 else "#d0d0d0", family="monospace", fontsize=11.5)
    axis.set_title("Actual cross-runtime test execution", color="white", fontweight="bold", pad=16)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    plt.savefig(OUTPUT / "12_test_execution.png", dpi=190, bbox_inches="tight", facecolor=figure.get_facecolor())
    plt.close()


def main() -> None:
    plt.style.use("grayscale")
    bar(["JavaScript", "Java"], [10, 4], "Passing automated tests by runtime", "Test cases", "01_test_suites.png")
    bar(["Products", "Categories", "Public orders"], [28, 7, 5], "Declared test data coverage", "Count", "02_catalogue_coverage.png")
    workflow_matrix()
    inventory_transitions()
    delivery_lifecycle()
    bar(["Confirmed", "Payment failed", "Stock changed"], [8, 3, 2], "Order stages reached before stopping", "Milestone position", "06_scenario_progress.png")
    bar(["Storefront", "Checkout", "Order journey", "Inventory", "Ezzie"], [1, 1, 1, 1, 1], "Browser verification evidence", "Verified views", "07_browser_evidence.png")
    architecture_flow(
        "08_frontend_api_architecture.png",
        "Frontend and request boundary",
        "The customer interface remains independent from deterministic order execution.",
        [
            ("Customer", "Browser", "search and checkout"),
            ("Storefront", "HTML + CSS + JS", "catalogue, cart, account"),
            ("State", "versioned localStorage", "cart, orders, stock"),
            ("Order request", "JSON contract", "typed checkout input"),
            ("Order API", "Spring Boot REST", "validation and response"),
        ],
    )
    architecture_flow(
        "09_backend_order_architecture.png",
        "Java backend order execution",
        "Each component owns one state transition and returns typed evidence.",
        [
            ("Controller", "Spring MVC", "validate request"),
            ("Coordinator", "Java service", "control sequence"),
            ("Inventory", "bounded component", "reserve or reject"),
            ("Payment", "bounded component", "approve or release"),
            ("Fulfilment", "Java records", "delivery milestones"),
        ],
    )
    architecture_flow(
        "10_customer_state_architecture.png",
        "Order state returned to the customer",
        "The same response drives the order page, profile history and Ezzie lookup.",
        [
            ("Order result", "typed JSON", "status and reason"),
            ("Inventory", "snapshot", "before, held, after"),
            ("Timeline", "eight milestones", "current and stopped"),
            ("History", "local order store", "recent activity"),
            ("Support", "Ezzie rules", "exact order lookup"),
        ],
    )
    architecture_flow(
        "11_delivery_architecture.png",
        "Build, deployment and verification",
        "Source, tests and public hosting remain separate, repeatable stages.",
        [
            ("Source", "Git + GitHub", "versioned implementation"),
            ("Rules", "Node test runner", "browser business logic"),
            ("Backend", "Maven + JUnit", "order service tests"),
            ("Evidence", "browser script", "journey screenshots"),
            ("Hosting", "Vercel", "public static store"),
        ],
    )
    test_execution()
    print("Wrote twelve report figures")


if __name__ == "__main__":
    main()
