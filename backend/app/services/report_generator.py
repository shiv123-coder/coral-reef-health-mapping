"""
PDF Report Generator with professional layout and QR code.

Features:
  - Modern typography and color scheme
  - Health percentage charts (bar chart)
  - Data tables for detections and diseases
  - QR code linking to public report page
  - Admin override fields reflected in final PDF
"""

import io
import os
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import qrcode
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.shapes import Drawing
from reportlab.platypus import (
    Image as RLImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.config import get_settings


# Brand colors
TEAL = colors.HexColor("#0D9488")
DARK = colors.HexColor("#0F172A")
LIGHT_BG = colors.HexColor("#F0FDFA")
ACCENT = colors.HexColor("#14B8A6")
WARN = colors.HexColor("#F59E0B")
DANGER = colors.HexColor("#EF4444")


def _make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="ReportTitle",
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=TEAL,
        alignment=TA_CENTER,
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="SectionHead",
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=DARK,
        spaceBefore=16,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="Body",
        fontName="Helvetica",
        fontSize=10,
        textColor=DARK,
        leading=14,
    ))
    styles.add(ParagraphStyle(
        name="Footer",
        fontName="Helvetica-Oblique",
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER,
    ))
    return styles


def _health_bar_chart(data: Dict[str, float]) -> Drawing:
    """Generate vertical bar chart for health percentages."""
    drawing = Drawing(240, 160)
    chart = VerticalBarChart()
    chart.x = 30
    chart.y = 20
    chart.height = 120
    chart.width = 180

    labels = ["Healthy", "Bleach", "Dead", "Algae", "Sand", "Rock"]
    keys = ["healthyCoralPct", "bleachedCoralPct", "deadCoralPct", "algaePct", "sandPct", "rockPct"]
    values = [data.get(k, 0) for k in keys]

    chart.data = [values]
    chart.categoryAxis.categoryNames = labels
    chart.categoryAxis.labels.fontSize = 7
    chart.categoryAxis.labels.angle = 45
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = 100
    chart.valueAxis.labels.fontSize = 8
    chart.bars[0].fillColor = TEAL
    chart.bars[0].strokeColor = TEAL
    drawing.add(chart)
    return drawing


def _generate_qr_image(url: str) -> io.BytesIO:
    """Generate QR code as PNG bytes."""
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0D9488", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


def generate_pdf_report(
    report_data: Dict[str, Any],
    output_path: str,
    qr_token: str,
    annotated_image_path: Optional[str] = None,
) -> str:
    """
    Generate professional PDF report.

    report_data should contain health percentages, user info, AI conclusion,
    and optional admin overrides.
    """
    settings = get_settings()
    styles = _make_styles()
    public_url = f"{settings.public_report_base_url}/{qr_token}"

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    story = []

    # Header
    story.append(Paragraph("Coral Reef Health Assessment Report", styles["ReportTitle"]))
    story.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}",
        styles["Footer"],
    ))
    story.append(Spacer(1, 12))

    # Left Column setup
    left_col = []
    
    # Uploader info table
    user_info = [
        ["Field", "Value"],
        ["Name", f"{report_data.get('firstName', '')} {report_data.get('lastName', '')}"],
        ["Organization", report_data.get("organization", "N/A")],
        ["Email", report_data.get("email", "N/A")],
        ["Role", report_data.get("role", "N/A")],
        ["Input File", report_data.get("fileName", "N/A")],
        ["Location", report_data.get("location", "Not specified")],
    ]
    user_table = Table(user_info, colWidths=[80, 160])
    user_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    left_col.append(Paragraph("Uploader Information", styles["SectionHead"]))
    left_col.append(user_table)
    left_col.append(Spacer(1, 10))

    # Health metrics
    metrics = {
        "healthyCoralPct": report_data.get("healthyCoralPct", 0),
        "bleachedCoralPct": report_data.get("bleachedCoralPct", 0),
        "deadCoralPct": report_data.get("deadCoralPct", 0),
        "algaePct": report_data.get("algaePct", 0),
        "sandPct": report_data.get("sandPct", 0),
        "rockPct": report_data.get("rockPct", 0),
    }

    risk = report_data.get("riskLevel", "Minimal")
    risk_color = DANGER if risk in ("Critical", "High") else WARN if risk == "Moderate" else TEAL

    metrics_data = [
        ["Metric", "Percentage"],
        ["Healthy Coral", f"{metrics['healthyCoralPct']:.1f}%"],
        ["Bleached Coral", f"{metrics['bleachedCoralPct']:.1f}%"],
        ["Dead Coral", f"{metrics['deadCoralPct']:.1f}%"],
        ["Algae Coverage", f"{metrics['algaePct']:.1f}%"],
        ["Sand", f"{metrics['sandPct']:.1f}%"],
        ["Rock", f"{metrics['rockPct']:.1f}%"],
        ["Risk Level", risk],
        ["Bleaching Index", f"{report_data.get('bleachingPercentage', 0):.1f}%"],
    ]
    metrics_table = Table(metrics_data, colWidths=[120, 120])
    metrics_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, LIGHT_BG]),
        ("BACKGROUND", (0, -1), (-1, -1), risk_color),
        ("TEXTCOLOR", (0, -1), (-1, -1), colors.white),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    left_col.append(Paragraph("Reef Health Metrics", styles["SectionHead"]))
    left_col.append(metrics_table)
    left_col.append(Spacer(1, 10))

    # AI Conclusion
    conclusion = report_data.get("aiConclusion") or report_data.get("ai_conclusion") or (
        f"Analysis indicates {metrics['healthyCoralPct']:.1f}% healthy coral coverage with "
        f"{metrics['bleachedCoralPct']:.1f}% bleaching. Overall risk level: {risk}. "
        f"{'Immediate monitoring recommended.' if risk in ('Critical', 'High') else 'Reef appears stable.'}"
    )
    left_col.append(Paragraph("AI Assessment Conclusion", styles["SectionHead"]))
    left_col.append(Paragraph(conclusion, styles["Body"]))

    if report_data.get("adminNotes"):
        left_col.append(Spacer(1, 8))
        left_col.append(Paragraph("Administrator Notes", styles["SectionHead"]))
        left_col.append(Paragraph(report_data["adminNotes"], styles["Body"]))

    # Diseases table
    diseases = report_data.get("diseases", [])
    if diseases:
        left_col.append(Spacer(1, 10))
        left_col.append(Paragraph("Detected Anomalies", styles["SectionHead"]))
        dis_data = [["Type", "Severity", "Affected %"]]
        for d in diseases[:3]:
            dis_data.append([d.get("type", ""), d.get("severity", ""), f"{d.get('affected_percent', 0):.1f}%"])
        dis_table = Table(dis_data, colWidths=[100, 70, 70])
        dis_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        left_col.append(dis_table)

    # Right Column setup
    right_col = []
    
    right_col.append(Paragraph("Composition Analysis", styles["SectionHead"]))
    right_col.append(_health_bar_chart(metrics))
    
    # Annotated image
    if annotated_image_path:
        right_col.append(Spacer(1, 10))
        right_col.append(Paragraph("Annotated Image Mapping", styles["SectionHead"]))
        try:
            if annotated_image_path.startswith("http"):
                req = urllib.request.Request(annotated_image_path, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req) as response:
                    img_data = io.BytesIO(response.read())
                img = RLImage(img_data, width=3.3 * inch, height=2.4 * inch)
            elif os.path.exists(annotated_image_path):
                img = RLImage(annotated_image_path, width=3.3 * inch, height=2.4 * inch)
            else:
                img = None
            if img:
                right_col.append(img)
        except Exception as e:
            print(f"Failed to embed image in PDF: {e}")

    # QR Code section
    right_col.append(Spacer(1, 10))
    right_col.append(Paragraph("Live Verification Portal", styles["SectionHead"]))
    
    qr_data = [
        [RLImage(_generate_qr_image(public_url), width=1.3 * inch, height=1.3 * inch), 
         Paragraph(f"Scan this QR code or visit:<br/>{public_url}<br/><br/>to view the verified live telemetry report.", styles["Body"])]
    ]
    qr_table = Table(qr_data, colWidths=[1.4 * inch, 2.0 * inch])
    qr_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    right_col.append(qr_table)

    # Master Table Layout
    master_table = Table([[left_col, right_col]], colWidths=[260, 260])
    master_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    
    story.append(master_table)

    # Footer
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "Vision-Based Deep Learning Framework for Coral Reef Health Mapping | SPPU BE 2019",
        styles["Footer"],
    ))

    doc.build(story)
    return output_path
