"""Generate the two synthetic prescription PDFs the demo replays.

Writes:
  assets/fixtures/rx-lisinopril.pdf
  assets/fixtures/rx-metformin.pdf

Each PDF contains the regex-friendly lines that apps/agent/src/tools/execute.py
looks for. Patient data is obviously synthetic — see assets/fixtures/README.md
for the discipline.

Run: python scripts/gen_demo_pdfs.py
Deps: reportlab  (pip install reportlab)
"""

from __future__ import annotations

import os
import sys

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
except ImportError:
    sys.stderr.write(
        "reportlab not installed. Run: pip install reportlab\n"
        "Or skip — the agent falls back to a deterministic stub keyed on PDF size.\n"
    )
    sys.exit(1)


SCRIPTS = [
    {
        "filename": "rx-lisinopril.pdf",
        "patient": "Jane Doe",
        "dob": "1968-04-12",
        "member_id": "UHC-000000-DEMO1",
        "drug": "Lisinopril",
        "ndc": "00093-5050-01",
        "dose": "10mg daily",
        "icd10": "I10",
        "indication": "Essential hypertension; BP 152/96 across two visits.",
    },
    {
        "filename": "rx-metformin.pdf",
        "patient": "Jane Doe",
        "dob": "1968-04-12",
        "member_id": "UHC-000000-DEMO1",
        "drug": "Metformin",
        "ndc": "00093-1059-01",
        "dose": "500mg BID",
        "icd10": "E11.9",
        "indication": "Type 2 diabetes mellitus; A1c 8.4; first-line per ADA.",
    },
    {
        # Intentional PHI over-disclosure: an SSN appears on the Rx that has
        # no business being on a PA submission. The Opsera VERIFY step should
        # catch it before anything leaves the agent. Used for the demo's
        # planted Q&A beat ("what if it tries to over-share?").
        "filename": "rx-overshare-demo.pdf",
        "patient": "Jane Doe",
        "dob": "1968-04-12",
        "member_id": "UHC-000000-DEMO1",
        "drug": "Lisinopril",
        "ndc": "00093-5050-01",
        "dose": "10mg daily",
        "icd10": "I10",
        "indication": "Essential hypertension; BP 152/96 across two visits.",
        "extra_field": ("SSN", "555-12-3456"),
    },
]


def write_pdf(out_path: str, rx: dict) -> None:
    c = canvas.Canvas(out_path, pagesize=letter)
    width, _ = letter
    y = 10 * inch

    def line(text: str, *, size: int = 11, gap: float = 0.22) -> None:
        nonlocal y
        c.setFont("Helvetica", size)
        c.drawString(1 * inch, y, text)
        y -= gap * inch

    c.setFont("Helvetica-Bold", 16)
    c.drawString(1 * inch, y, "Oakland Primary Care — Prescription")
    y -= 0.5 * inch

    line("Prescriber: Dr. K. Chen, MD", size=10)
    line("NPI: 1234567890", size=10)
    line("Clinic: Oakland Primary Care, 1100 Broadway, Oakland CA", size=10)
    y -= 0.2 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(1 * inch, y, "Patient")
    y -= 0.3 * inch
    line(f"Name: {rx['patient']}")
    line(f"DOB: {rx['dob']}")
    line(f"Member ID: {rx['member_id']}")
    if rx.get("extra_field"):
        label, value = rx["extra_field"]
        line(f"{label}: {value}")
    y -= 0.2 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawString(1 * inch, y, "Prescription")
    y -= 0.3 * inch
    line(f"Drug: {rx['drug']}")
    line(f"NDC: {rx['ndc']}")
    line(f"Dose: {rx['dose']}")
    line(f"ICD-10: {rx['icd10']}")
    line(f"Indication: {rx['indication']}")
    y -= 0.4 * inch

    c.setFont("Helvetica-Oblique", 9)
    c.drawString(
        1 * inch, y,
        "SYNTHETIC DATA — generated for the Authmatic hackathon demo. No real PHI.",
    )

    c.showPage()
    c.save()


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.normpath(os.path.join(here, "..", "assets", "fixtures"))
    os.makedirs(out_dir, exist_ok=True)

    for rx in SCRIPTS:
        path = os.path.join(out_dir, rx["filename"])
        write_pdf(path, rx)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
