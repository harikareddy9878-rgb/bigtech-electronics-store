"""Build the BigTech website and Java service report."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "reports/BigTech_Electronics_Store_Report.pdf"
NAVY = colors.HexColor("#132238")
BLUE = colors.HexColor("#155eef")
PALE = colors.HexColor("#eaf1fc")


def footer(canvas, document):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(2 * cm, 1.1 * cm, "BigTech Electronics Store")
    canvas.drawRightString(19 * cm, 1.1 * cm, f"Page {document.page}")
    canvas.restoreState()


def build_report() -> Path:
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontSize=30, leading=35, textColor=NAVY, alignment=TA_CENTER, spaceAfter=18))
    styles.add(ParagraphStyle(name="Section", parent=styles["Heading1"], fontSize=19, leading=24, textColor=NAVY, spaceAfter=13))
    styles.add(ParagraphStyle(name="Sub", parent=styles["Heading2"], fontSize=12, leading=16, textColor=BLUE, spaceBefore=8, spaceAfter=5))
    styles.add(ParagraphStyle(name="BodyR", parent=styles["BodyText"], fontSize=10, leading=15, textColor=colors.HexColor("#343d4b"), spaceAfter=9))
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=1.8 * cm, title="BigTech Electronics Store", author="Harika")
    story = []
    table_style = TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cad4e2")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("PADDING", (0, 0), (-1, -1), 7)])
    story.extend([Spacer(1, 3.0 * cm), Paragraph("BigTech Electronics Store", styles["CoverTitle"]), Paragraph("Retail journey, Java order coordination, and Ezzie support", ParagraphStyle(name="CoverSub", parent=styles["BodyR"], fontSize=14, leading=20, textColor=BLUE, alignment=TA_CENTER)), Spacer(1, 1.2 * cm), Table([["Project type", "Full stack ecommerce demonstration"], ["Catalogue", "28 products across 7 categories"], ["Backend", "Java and Spring Boot"], ["Prepared by", "Harika"]], colWidths=[4 * cm, 9 * cm], style=TableStyle([("BACKGROUND", (0, 0), (0, -1), PALE), ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cad4e2")), ("PADDING", (0, 0), (-1, -1), 9)])), PageBreak()])
    sections = [
        ("1. Executive summary", ["BigTech is a responsive Indian electronics store demonstration with 28 products across phones, laptops, televisions, audio, appliances, wearables, and gaming.", "The complete customer journey covers discovery, stock, cart, checkout, successful and failed payments, confirmation, delivery estimate, order history, account, and Ezzie support.", "A Spring Boot service implements the order sequence independently from the browser demo and is verified with JUnit."]),
        ("2. Problem and purpose", ["A product grid alone does not demonstrate ecommerce behaviour. Cart quantities, stock changes, payment outcomes, delivery estimates, order history, and support must agree.", "The project purpose is to demonstrate those connected rules at final-year student scope while keeping every commercial integration simulated.", "Success means both positive and failure paths work, tests cover the core rules, and public documentation states the boundaries clearly."]),
        ("3. Customer journey", ["Customers search, filter, sort, inspect stock, and add an available product. Cart quantities cannot exceed the published demo stock.", "Checkout collects a demonstration address and a selected payment outcome without requesting card, bank, or UPI details. Stock is checked again before payment.", "Confirmed orders receive an order number and estimated date. Failed payments stay visible without a fulfilment promise. The account area links saved address, orders, and Ezzie."]),
        ("4. Storefront design", ["The interface uses a dark navy retail header, focused search, category navigation, a light technology hero, service promises, responsive product cards, and clear price and stock states.", "The information architecture keeps orders, account, and cart available in the header. On mobile, the grid, checkout, and account sections collapse to one column.", "The deployed site is intentionally lightweight and does not require an account or external API to demonstrate the journey."]),
    ]
    for title, paragraphs in sections:
        story.append(Paragraph(title, styles["Section"]))
        for paragraph in paragraphs:
            story.append(Paragraph(paragraph, styles["BodyR"]))
        if title.startswith("3."):
            story.append(Table([["Step", "Outcome"], ["Discover", "Search, category, sort, price, rating, and stock"], ["Cart", "Quantity control and INR totals"], ["Checkout", "Address validation and payment simulation"], ["Confirmation", "Order number and delivery estimate"], ["Account", "Saved profile, address, orders, and support"]], colWidths=[4 * cm, 10 * cm], style=table_style))
        story.append(PageBreak())
    story.extend([Paragraph("5. Verified storefront", styles["Section"]), Image(str(ROOT / "evidence/bigtech_storefront.png"), width=17 * cm, height=11 * cm), Paragraph("The storefront evidence is captured from the running application and shows the same catalogue and stock rules used by browser tests.", styles["BodyR"]), PageBreak()])
    story.extend([Paragraph("6. Cart and checkout", styles["Section"]), Image(str(ROOT / "evidence/cart_checkout.png"), width=17 * cm, height=12.4 * cm), Paragraph("The cart repeats product, quantity, price, delivery, and total. Checkout labels payment as a simulation and revalidates inventory before creating an order.", styles["BodyR"]), PageBreak()])
    story.extend([Paragraph("7. Ezzie support", styles["Section"]), Image(str(ROOT / "evidence/ezzie_assistant.png"), width=17 * cm, height=12.4 * cm), Paragraph("Ezzie supports product discovery, budget, stock, cart, checkout, payment, delivery, returns, and saved order numbers. It stays within the website and can add a recommendation directly to the cart.", styles["BodyR"]), PageBreak()])
    final = [
        ("8. Java order coordination", ["The API validates order items, customer name, pincode, and payment outcome. Inventory runs before payment, and fulfilment runs only after authorisation.", "Explicit failure codes distinguish STOCK_CHANGED from PAYMENT_FAILED. Large-item categories use a longer estimate and a Clock dependency keeps tests deterministic.", "The controller, coordinator, inventory, payment, and fulfilment classes keep responsibilities small enough to explain and test."], [["Component", "Responsibility"], ["OrderController", "Validate and return HTTP results"], ["InventoryService", "Check requested quantity"], ["PaymentService", "Simulate authorisation"], ["FulfilmentService", "Calculate an estimate"], ["OrderCoordinator", "Apply the sequence and failure rules"]]),
        ("9. Verification, deployment, and limitations", ["Seven frontend tests cover stock, totals, failed payment, Ezzie scope, budget recommendation, catalogue coverage, and gaming intent. Three Java tests cover confirmation, stock rejection, and failed payment.", "Browser verification completes a successful order, confirms history, and checks a failed-payment path. The public site is deployed on Vercel with clean URLs and a single-page rewrite.", "The project has no real authentication, payment gateway, shared database, courier integration, or live inventory. Browser state is device-local and all customer and order data is simulated."], [["Scenario", "Expected behaviour"], ["Out of stock", "Cannot add"], ["Changed stock", "Checkout stops before payment"], ["Failed payment", "No delivery date"], ["Successful payment", "Order number and estimate"], ["Outside Ezzie scope", "Website-only boundary"]]),
    ]
    for title, paragraphs, rows in final:
        story.append(Paragraph(title, styles["Section"]))
        for paragraph in paragraphs:
            story.append(Paragraph(paragraph, styles["BodyR"]))
        story.append(Table(rows, colWidths=[5 * cm, 9 * cm], style=table_style))
        if not title.startswith("9."):
            story.append(PageBreak())
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return OUTPUT


if __name__ == "__main__":
    print(build_report())
