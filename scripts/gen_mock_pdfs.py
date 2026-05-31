"""Generates the secondary demo PDFs: insurance cards (2 patients) and a
Humira prescription for Lawrence Thompson. Pairs with gen_demo_pdfs.py
(simple Lisinopril/Metformin) for a richer demo set.

Run: python scripts/gen_mock_pdfs.py
Deps: reportlab  (pip install reportlab)
Output: assets/fixtures/insurance_cards.pdf, assets/fixtures/rx-humira-thompson.pdf
"""

import os

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas as pdfcanvas

W, H = letter

_OUT_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "fixtures")
)
os.makedirs(_OUT_DIR, exist_ok=True)

def styles_base():
    styles = getSampleStyleSheet()
    return styles

# ── INSURANCE CARD (both patients, one PDF, 2 pages) ──────────────────────────
def build_insurance_cards():
    from reportlab.platypus import SimpleDocTemplate, PageBreak
    doc = SimpleDocTemplate(
        os.path.join(_OUT_DIR, "insurance_cards.pdf"),
        pagesize=letter,
        rightMargin=1.5*inch, leftMargin=1.5*inch,
        topMargin=1*inch, bottomMargin=1*inch
    )
    styles = styles_base()

    card_title = ParagraphStyle('CardTitle', parent=styles['Normal'],
        fontSize=9, fontName='Helvetica-Bold', textColor=colors.white, spaceAfter=2)
    card_body = ParagraphStyle('CardBody', parent=styles['Normal'],
        fontSize=8, fontName='Helvetica', textColor=colors.white, leading=13)
    card_label = ParagraphStyle('CardLabel', parent=styles['Normal'],
        fontSize=7, fontName='Helvetica-Bold', textColor=colors.HexColor('#b0d4ff'), leading=10)
    card_value = ParagraphStyle('CardValue', parent=styles['Normal'],
        fontSize=9, fontName='Helvetica-Bold', textColor=colors.white, leading=13)
    small = ParagraphStyle('Small', parent=styles['Normal'],
        fontSize=7, fontName='Helvetica', textColor=colors.HexColor('#888888'), alignment=TA_CENTER)

    story = []

    def make_card(member_name, member_id, group_no, plan_name, payer_name,
                  payer_color, copay_pcp, copay_spec, copay_er, rx_bin, rx_pcn,
                  phone_member, phone_provider, phone_rx, back_address):

        # FRONT
        front_data = [[
            Paragraph(payer_name.upper(), ParagraphStyle('PN', parent=styles['Normal'],
                fontSize=13, fontName='Helvetica-Bold', textColor=colors.white)),
            Paragraph("MEMBER ID CARD", ParagraphStyle('MIT', parent=styles['Normal'],
                fontSize=8, fontName='Helvetica', textColor=colors.HexColor('#ccddff'),
                alignment=1)),
        ]]
        front_hdr = Table(front_data, colWidths=[3*inch, 2.1*inch])
        front_hdr.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(payer_color)),
            ('TOPPADDING', (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
            ('LEFTPADDING', (0,0), (0,-1), 14),
            ('RIGHTPADDING', (-1,0), (-1,-1), 14),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))

        info_data = [
            [Paragraph("MEMBER", card_label), Paragraph("PLAN", card_label)],
            [Paragraph(member_name, card_value), Paragraph(plan_name, card_value)],
            [Paragraph("MEMBER ID", card_label), Paragraph("GROUP", card_label)],
            [Paragraph(member_id, card_value), Paragraph(group_no, card_value)],
        ]
        info_table = Table(info_data, colWidths=[2.55*inch, 2.55*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(payer_color)),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 14),
        ]))

        copay_data = [[
            Paragraph("PCP\n" + copay_pcp, ParagraphStyle('CP', parent=styles['Normal'],
                fontSize=8, fontName='Helvetica', textColor=colors.white, leading=12, alignment=1)),
            Paragraph("SPECIALIST\n" + copay_spec, ParagraphStyle('CP', parent=styles['Normal'],
                fontSize=8, fontName='Helvetica', textColor=colors.white, leading=12, alignment=1)),
            Paragraph("ER\n" + copay_er, ParagraphStyle('CP', parent=styles['Normal'],
                fontSize=8, fontName='Helvetica', textColor=colors.white, leading=12, alignment=1)),
        ]]
        copay_table = Table(copay_data, colWidths=[1.7*inch, 1.7*inch, 1.7*inch])
        copay_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ffffff22')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#ffffff33')),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(payer_color)),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))

        rx_data = [[
            Paragraph(f"RX BIN: {rx_bin}", card_label),
            Paragraph(f"RX PCN: {rx_pcn}", card_label),
        ]]
        rx_table = Table(rx_data, colWidths=[2.55*inch, 2.55*inch])
        rx_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(payer_color)),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 14),
        ]))

        # wrap entire front in one outer table for card look
        card_front = Table(
            [[front_hdr], [info_table], [copay_table], [rx_table]],
            colWidths=[5.1*inch]
        )
        card_front.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(payer_color)),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cccccc')),
            ('ROUNDEDCORNERS', [8,8,8,8]),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))

        # BACK
        back_data = [[
            [
                Paragraph("MEMBER SERVICES", card_label),
                Paragraph(phone_member, card_value),
                Spacer(1,4),
                Paragraph("PROVIDER SERVICES", card_label),
                Paragraph(phone_provider, card_value),
                Spacer(1,4),
                Paragraph("PHARMACY (RX)", card_label),
                Paragraph(phone_rx, card_value),
            ],
            [
                Paragraph("SUBMIT CLAIMS TO:", card_label),
                Paragraph(back_address, ParagraphStyle('BA', parent=styles['Normal'],
                    fontSize=8, fontName='Helvetica', textColor=colors.white, leading=12)),
            ]
        ]]
        back_table = Table(back_data, colWidths=[2.55*inch, 2.55*inch])
        back_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(payer_color)),
            ('TOPPADDING', (0,0), (-1,-1), 14),
            ('BOTTOMPADDING', (0,0), (-1,-1), 14),
            ('LEFTPADDING', (0,0), (-1,-1), 14),
            ('RIGHTPADDING', (0,0), (-1,-1), 14),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cccccc')),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))

        return card_front, back_table

    story.append(Paragraph("DEMO INSURANCE CARDS — FOR DEMO PURPOSES ONLY",
        ParagraphStyle('Hdr', parent=styles_base()['Normal'], fontSize=10, fontName='Helvetica-Bold',
            textColor=colors.HexColor('#333333'), alignment=TA_CENTER, spaceAfter=20)))

    # Card 1: Sarah Martinez / HealthFirst
    front1, back1 = make_card(
        member_name="Sarah Elena Martinez",
        member_id="HF-45821973",
        group_no="GRP-7821",
        plan_name="Choice Plus PPO",
        payer_name="HealthFirst",
        payer_color="#0057A8",
        copay_pcp="$25", copay_spec="$50", copay_er="$150",
        rx_bin="004336", rx_pcn="ADV",
        phone_member="(800) 555-4200",
        phone_provider="(800) 555-4210",
        phone_rx="(800) 555-4220",
        back_address="HealthFirst PPO\nP.O. Box 14000\nSacramento, CA 94203"
    )
    story.append(Paragraph("Sarah Elena Martinez — HealthFirst Choice Plus PPO",
        ParagraphStyle('SH', parent=styles_base()['Normal'], fontSize=9, fontName='Helvetica-Bold',
            textColor=colors.HexColor('#555555'), spaceAfter=8)))
    story.append(Table([[front1, Spacer(0.3*inch, 1)]], colWidths=[5.1*inch, 0.3*inch]))
    story.append(Spacer(1, 12))
    story.append(Table([[back1, Spacer(0.3*inch, 1)]], colWidths=[5.1*inch, 0.3*inch]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("CONFIDENTIAL — FOR DEMO PURPOSES ONLY. All data is fictitious.", small))

    story.append(PageBreak())

    # Card 2: Robert Thompson / Aetna
    front2, back2 = make_card(
        member_name="Robert James Thompson",
        member_id="AET-78230014",
        group_no="GRP-AET-3301",
        plan_name="Open Choice PPO",
        payer_name="Aetna Better Health",
        payer_color="#5E1281",
        copay_pcp="$30", copay_spec="$60", copay_er="$200",
        rx_bin="020099", rx_pcn="ADV",
        phone_member="(800) 555-7100",
        phone_provider="(800) 555-7120",
        phone_rx="(800) 555-7130",
        back_address="Aetna Better Health\n151 Farmington Avenue\nHartford, CT 06156"
    )
    story.append(Paragraph("Robert James Thompson — Aetna Open Choice PPO",
        ParagraphStyle('SH', parent=styles_base()['Normal'], fontSize=9, fontName='Helvetica-Bold',
            textColor=colors.HexColor('#555555'), spaceAfter=8)))
    story.append(Table([[front2, Spacer(0.3*inch, 1)]], colWidths=[5.1*inch, 0.3*inch]))
    story.append(Spacer(1, 12))
    story.append(Table([[back2, Spacer(0.3*inch, 1)]], colWidths=[5.1*inch, 0.3*inch]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("CONFIDENTIAL — FOR DEMO PURPOSES ONLY. All data is fictitious.", small))

    doc.build(story)
    print("Insurance cards created.")


# ── THOMPSON PRESCRIPTION (Humira / Aetna — second demo run) ─────────────────
def build_thompson_prescription():
    doc = SimpleDocTemplate(
        os.path.join(_OUT_DIR, "rx-humira-thompson.pdf"),
        pagesize=letter,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )
    styles = styles_base()

    header_style = ParagraphStyle('Header', parent=styles['Normal'],
        fontSize=18, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a3a5c'), spaceAfter=2)
    subheader_style = ParagraphStyle('SubHeader', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica', textColor=colors.HexColor('#555555'), spaceAfter=4)
    section_style = ParagraphStyle('Section', parent=styles['Normal'],
        fontSize=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a3a5c'),
        spaceBefore=16, spaceAfter=6)
    body_style = ParagraphStyle('Body', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica', leading=16)
    label_style = ParagraphStyle('Label', parent=styles['Normal'],
        fontSize=9, fontName='Helvetica-Bold', textColor=colors.HexColor('#555555'))
    value_style = ParagraphStyle('Value', parent=styles['Normal'],
        fontSize=10, fontName='Helvetica')
    rx_drug_style = ParagraphStyle('RxDrug', parent=styles['Normal'],
        fontSize=15, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a3a5c'))
    small_style = ParagraphStyle('Small', parent=styles['Normal'],
        fontSize=7, fontName='Helvetica', textColor=colors.HexColor('#aaaaaa'), alignment=TA_CENTER)

    story = []

    story.append(Paragraph("BAYVIEW FAMILY MEDICAL GROUP", header_style))
    story.append(Paragraph("995 Market Street, Suite 400 · San Francisco, CA 94103", subheader_style))
    story.append(Paragraph("Phone: (415) 555-0192 · Fax: (415) 555-0193", subheader_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1a3a5c')))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Rx — PRESCRIPTION", ParagraphStyle('RxTitle',
        parent=styles['Normal'], fontSize=14, fontName='Helvetica-Bold',
        textColor=colors.HexColor('#c0392b'), alignment=TA_CENTER, spaceAfter=12)))

    provider_data = [
        [Paragraph("PRESCRIBER", label_style), Paragraph("PATIENT", label_style)],
        [Paragraph("Dr. James Okafor, MD", value_style), Paragraph("Robert James Thompson", value_style)],
        [Paragraph("NPI: 1234567891", value_style), Paragraph("DOB: 07/22/1971", value_style)],
        [Paragraph("DEA: AO9876543", value_style), Paragraph("Insurance: Aetna Better Health PPO", value_style)],
        [Paragraph("License: CA G-91203", value_style), Paragraph("Member ID: AET-78230014", value_style)],
        [Paragraph("Date: 05/22/2025", value_style), Paragraph("MRN: BFM-2023-01142", value_style)],
    ]
    provider_table = Table(provider_data, colWidths=[3.25*inch, 3.25*inch])
    provider_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a3a5c')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f4f7fb'), colors.white]),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#c5d3e0')),
        ('INNERGRID', (0,0), (-1,-1), 0.3, colors.HexColor('#dce6ef')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('LINEBEFORE', (1,0), (1,-1), 0.5, colors.HexColor('#c5d3e0')),
    ]))
    story.append(provider_table)

    story.append(Paragraph("PRESCRIBED MEDICATION", section_style))
    rx_data = [[
        Paragraph("&#x211E;", ParagraphStyle('RxSymbol', parent=styles['Normal'],
            fontSize=28, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a3a5c'))),
        [
            Paragraph("Humira (adalimumab) injection", rx_drug_style),
            Spacer(1, 4),
            Paragraph("40mg/0.4mL prefilled autoinjector pen", body_style),
            Spacer(1, 4),
            Paragraph("""<b>Sig:</b> Initiation: 160mg SQ (four 40mg injections) on Day 1,
then 80mg SQ (two 40mg injections) on Day 15,
then 40mg SQ every 2 weeks thereafter.""", body_style),
            Spacer(1, 4),
            Paragraph("<b>Dispense:</b> 2 pens (initial supply)", body_style),
            Paragraph("<b>Refills:</b> 5 (subject to prior authorization approval)", body_style),
            Paragraph("<b>Route:</b> Subcutaneous injection (thigh or abdomen)", body_style),
        ]
    ]]
    rx_table = Table(rx_data, colWidths=[0.5*inch, 6.0*inch])
    rx_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 1.0, colors.HexColor('#1a3a5c')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f5fb')),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (0,-1), 10),
        ('LEFTPADDING', (1,0), (1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(rx_table)

    story.append(Paragraph("CLINICAL JUSTIFICATION FOR PRIOR AUTHORIZATION", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#c5d3e0')))
    story.append(Spacer(1, 6))

    justification_data = [[Paragraph("""
<b>Indication:</b> Rheumatoid Arthritis, moderate-to-severe (ICD-10: M06.9, M06.011).<br/><br/>

<b>Previous Therapies Tried and Failed:</b><br/>
&nbsp;&nbsp;• Methotrexate 15mg once weekly — 24 months — inadequate response<br/>
&nbsp;&nbsp;• Folic acid 1mg daily (adjunct) — concurrent with MTX<br/>
&nbsp;&nbsp;• NSAIDs — documented intolerance (GI bleed)<br/><br/>

<b>Current Disease Activity:</b><br/>
&nbsp;&nbsp;• DAS28 score: 4.8 (moderate-to-high disease activity) — assessed 05/08/2025<br/>
&nbsp;&nbsp;• CRP: 18 mg/L (elevated) — collected 05/08/2025<br/>
&nbsp;&nbsp;• ESR: 42 mm/hr (elevated) — collected 05/08/2025<br/>
&nbsp;&nbsp;• CBC and LFTs: within normal limits — no contraindication to biologic therapy<br/>
&nbsp;&nbsp;• TB screening: negative (QuantiFERON-TB Gold) — 03/14/2025<br/><br/>

<b>Clinical Rationale:</b> Patient has moderate-to-severe RA with persistent high disease activity despite 24 months of
maximum-dose Methotrexate therapy. Per ACR 2024 Treatment Guidelines, a TNF inhibitor is indicated
for patients with moderate-to-severe RA inadequately controlled on conventional DMARDs.
Adalimumab (Humira) selected due to established safety profile and cardiovascular risk profile.
Negative TB screen documented. Baseline labs confirm no organ dysfunction.
    """, body_style)]]
    just_table = Table(justification_data, colWidths=[6.5*inch])
    just_table.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#c5d3e0')),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fdfefe')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(just_table)

    story.append(Paragraph("PRIOR AUTHORIZATION — KEY FIELDS SUMMARY", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#c5d3e0')))
    story.append(Spacer(1, 4))
    pa_data = [
        ["Field", "Value"],
        ["Patient Name", "Robert James Thompson"],
        ["Date of Birth", "07/22/1971"],
        ["Insurance / Payer", "Aetna Better Health PPO"],
        ["Member ID", "AET-78230014"],
        ["Group Number", "GRP-AET-3301"],
        ["Primary Diagnosis (ICD-10)", "M06.9 — Rheumatoid arthritis, unspecified"],
        ["Secondary Diagnosis (ICD-10)", "M06.011 — RA with RF of right shoulder"],
        ["Requested Drug", "Humira (adalimumab) 40mg/0.4mL autoinjector"],
        ["Drug NDC", "0074-3799-02"],
        ["Prescribing Physician", "Dr. James Okafor, MD"],
        ["NPI", "1234567891"],
        ["Clinic Name", "Bayview Family Medical Group"],
        ["Clinic Phone", "(415) 555-0192"],
        ["Clinic Fax", "(415) 555-0193"],
        ["DAS28 Score", "4.8 (moderate-to-high activity)"],
        ["TB Screening", "Negative (QuantiFERON-TB Gold, 03/14/2025)"],
        ["Clinical Urgency", "Routine"],
        ["Date of Request", "05/22/2025"],
    ]
    pa_table = Table(pa_data, colWidths=[2.5*inch, 4.0*inch])
    pa_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a3a5c')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('FONTNAME', (0,1), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,1), (1,-1), 'Helvetica'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f4f7fb')]),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#c5d3e0')),
        ('INNERGRID', (0,0), (-1,-1), 0.3, colors.HexColor('#dce6ef')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(pa_table)

    story.append(Spacer(1, 20))
    sig_data = [[
        Paragraph("_________________________________\nDr. James Okafor, MD\nLicense: CA G-91203 · NPI: 1234567891\nDate: 05/22/2025", body_style),
        Paragraph("SUBSTITUTION PERMITTED\n\n☐ Substitution NOT Permitted\n(brand medically necessary)", body_style),
    ]]
    sig_table = Table(sig_data, colWidths=[3.5*inch, 3.0*inch])
    sig_table.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('TOPPADDING', (0,0), (-1,-1), 6)]))
    story.append(sig_table)

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#c5d3e0')))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "CONFIDENTIAL — FOR DEMO PURPOSES ONLY. All patient data is fictitious.",
        small_style))

    doc.build(story)
    print("Thompson/Humira prescription created.")


build_insurance_cards()
build_thompson_prescription()
print("All PDFs done.")
