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
ORANGE = colors.HexColor("#ff8a3d")
PALE = colors.HexColor("#eaf1fc")


def footer(canvas, document):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#667085"))
    canvas.drawString(2 * cm, 1.15 * cm, "BigTech Electronics Store")
    canvas.drawRightString(19 * cm, 1.15 * cm, f"Page {document.page}")
    canvas.restoreState()


def build_report() -> Path:
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontSize=30, leading=35, textColor=NAVY, alignment=TA_CENTER, spaceAfter=18))
    styles.add(ParagraphStyle(name="SectionTitle", parent=styles["Heading1"], fontSize=20, leading=25, textColor=NAVY, spaceAfter=14))
    styles.add(ParagraphStyle(name="Subhead", parent=styles["Heading2"], fontSize=12, leading=16, textColor=BLUE, spaceBefore=9, spaceAfter=5))
    styles.add(ParagraphStyle(name="BodyReport", parent=styles["BodyText"], fontSize=10, leading=15, textColor=colors.HexColor("#343d4b"), spaceAfter=9))
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm, bottomMargin=1.8 * cm, title="BigTech Electronics Store", author="Harika", subject="Full stack Java and ecommerce project report")
    story = []
    table_style = TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white), ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cad4e2")), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("PADDING", (0, 0), (-1, -1), 7)])

    story.extend([Spacer(1, 3.1 * cm), Paragraph("BigTech Electronics Store", styles["CoverTitle"]), Paragraph("Product discovery, checkout, order coordination, and Ezzie support", ParagraphStyle(name="CoverSub", parent=styles["BodyReport"], fontSize=14, leading=20, textColor=BLUE, alignment=TA_CENTER)), Spacer(1, 1.3 * cm), Table([["Project type", "Full stack Java ecommerce demonstration"], ["Market", "India"], ["Frontend", "HTML, CSS, and JavaScript"], ["Backend", "Java and Spring Boot"], ["Prepared by", "Harika"]], colWidths=[4 * cm, 9 * cm], style=TableStyle([("BACKGROUND", (0, 0), (0, -1), PALE), ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"), ("TEXTCOLOR", (0, 0), (0, -1), NAVY), ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cad4e2")), ("PADDING", (0, 0), (-1, -1), 9)])), Spacer(1, 1.1 * cm), Paragraph("This report documents the customer journey, website design, Java order flow, failure scenarios, Ezzie support, testing, deployment, and limitations.", styles["BodyReport"]), PageBreak()])

    sections = [
        ("1. Executive summary", ["BigTech is a small electronics store demonstration with twenty products across phones, laptops, televisions, audio, and appliances. Prices use Indian Rupees and the interface works on desktop and mobile layouts.", "The customer journey covers search, category filters, sorting, stock status, cart quantities, address validation, payment simulation, confirmation, failed payment, delivery estimate, and recent orders.", "The frontend remains usable as a static hosted demonstration. A separate Spring Boot API implements request validation and a testable order coordination sequence."]),
        ("2. Problem and project purpose", ["A believable ecommerce project needs more than attractive product cards. It must preserve cart state, prevent impossible quantities, recheck stock before payment, distinguish payment failure from order confirmation, and explain what happens next.", "The project purpose is to demonstrate these connected behaviours at a final-year student scope. It is not a commercial store, a payment processor, or a live inventory system.", "Success means that ordinary and failure flows both work, tests cover the business rules, and the documentation clearly separates simulated behaviour from real transactions."]),
        ("3. Customer journey", ["The home page introduces the store and presents categories. Search matches product names and categories, while sorting changes the catalogue without reloading the page.", "Adding a product checks published demo stock. The cart supports quantity changes up to available stock and calculates subtotal, delivery, and total. Checkout validates contact and pincode fields without requesting card or UPI details.", "Successful payment produces an order number and delivery estimate. Failed payment creates a visible order record without a delivery date, making the negative path inspectable."]),
    ]
    for title, paragraphs in sections:
        story.append(Paragraph(title, styles["SectionTitle"]))
        for paragraph in paragraphs:
            story.append(Paragraph(paragraph, styles["BodyReport"]))
        if title.startswith("3."):
            story.append(Table([["Step", "Customer outcome"], ["Browse", "Search, filter, sort, and compare"], ["Cart", "Change quantity and see price totals"], ["Checkout", "Enter delivery details and simulate payment"], ["Confirmation", "Receive order number and date"], ["Orders", "Review confirmed, shipped, and failed examples"]], colWidths=[4 * cm, 10 * cm], style=table_style))
        story.append(PageBreak())

    story.extend([Paragraph("4. Storefront design", styles["SectionTitle"]), Image(str(ROOT / "evidence/bigtech_storefront.png"), width=10.6 * cm, height=23.5 * cm), PageBreak()])

    story.extend([Paragraph("5. Cart and checkout", styles["SectionTitle"]), Image(str(ROOT / "evidence/cart_checkout.png"), width=17 * cm, height=12.39 * cm), Spacer(1, 0.4 * cm), Paragraph("The cart keeps product, quantity, unit price, delivery, and total visible in one place. Checkout repeats the order summary and labels payment as a simulation. Stock is checked again when the order is created, preventing a stale cart from silently succeeding.", styles["BodyReport"]), PageBreak()])

    story.extend([Paragraph("6. Ezzie customer support", styles["SectionTitle"]), Image(str(ROOT / "evidence/ezzie_assistant.png"), width=17 * cm, height=12.39 * cm), Spacer(1, 0.4 * cm), Paragraph("Ezzie answers questions about BigTech products, budget, stock, cart, checkout, payment, delivery, returns, and order numbers. A product answer can add the suggested item directly to the cart. Unrelated requests receive a scope boundary instead of an invented answer.", styles["BodyReport"]), PageBreak()])

    final_sections = [
        ("7. Java order coordination", ["The Spring Boot API receives a validated order request. Inventory is checked before payment, payment outcome is evaluated, and fulfilment is scheduled only for an accepted order.", "The coordinator returns explicit failure codes. STOCK_CHANGED stops a request before payment, while PAYMENT_FAILED records that inventory was available but authorisation did not succeed.", "Large items such as televisions and appliances receive a four day estimate. Smaller electronics use two days. A Clock dependency makes date behaviour deterministic in tests."], [["Component", "Responsibility"], ["OrderController", "Validate HTTP requests and return status"], ["InventoryService", "Verify requested quantity"], ["PaymentService", "Simulate authorisation"], ["FulfilmentService", "Calculate delivery date"], ["OrderCoordinator", "Apply the sequence and failure rules"]]),
        ("8. Verification and scenarios", ["Five frontend unit tests cover stock, cart totals, failed payment, Ezzie scope, and budget recommendation. Three Java tests cover confirmation, stock rejection, and failed payment without a delivery date.", "Browser verification checks the full storefront, opens Ezzie, adds a suggested laptop, and confirms the cart total. Evidence images are generated from the running site.", "Continuous integration runs the JavaScript and Java suites on every update."], [["Scenario", "Expected result"], ["Out of stock item", "Add button disabled"], ["Quantity exceeds stock", "Cart update blocked"], ["Payment succeeds", "Confirmed order and delivery date"], ["Payment fails", "Failed order and no delivery date"], ["Outside Ezzie topic", "Website-only boundary"]]),
        ("9. Deployment, limitations, and next steps", ["The public folder is deployable as a static website. Browser local storage holds demo cart and order history, so each visitor sees state only on the current device. The Java service runs locally as an independently tested API.", "The project has no authentication, database, real product feed, payment gateway, courier integration, or multi-device account. Stock resets with the demo data and order numbers are not commercial records.", "Next steps are to connect the frontend to the Java API, add a small database, introduce customer authentication, validate idempotent payments, reserve stock transactionally, and deploy the backend to a Java hosting service. These additions should follow only after the current flow stays fully tested."], [["Deployment", "Role"], ["Static host", "Public customer demonstration"], ["Local Spring Boot", "Java API demonstration"], ["GitHub Actions", "Repeat frontend and backend tests"], ["PDF report", "Explain decisions and evidence"]]),
    ]
    for title, paragraphs, table in final_sections:
        story.append(Paragraph(title, styles["SectionTitle"]))
        for paragraph in paragraphs:
            story.append(Paragraph(paragraph, styles["BodyReport"]))
        story.append(Table(table, colWidths=[5 * cm, 9 * cm], style=table_style))
        if not title.startswith("9."):
            story.append(PageBreak())

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return OUTPUT


if __name__ == "__main__":
    print(build_report())
