"""Report routes — PDF, CSV, admin override."""

import csv
import io
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from app.config import get_settings
from app.core.firebase import get_analysis, get_public_report, get_report, save_public_report, save_report
from app.core.security import get_current_user, require_admin
from app.models.schemas import ReportOverrideRequest
from app.services.report_generator import generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{report_id}")
async def get_report_by_id(report_id: str, user: dict = Depends(get_current_user)):
    report = get_report(report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    if report.get("userId") != user["uid"] and user.get("role") != "admin":
        raise HTTPException(403, "Access denied")
    return report


@router.put("/{report_id}/override")
async def override_report(
    report_id: str,
    body: ReportOverrideRequest,
    admin: dict = Depends(require_admin),
):
    """Admin override of AI conclusions before PDF finalization."""
    report = get_report(report_id)
    if not report:
        raise HTTPException(404, "Report not found")

    updates = body.model_dump(exclude_none=True)
    updates["adminOverride"] = True
    updates["overriddenBy"] = admin["uid"]
    report.update(updates)
    save_report(report_id, report)

    return {"message": "Report updated", "report": report}


@router.get("/{report_id}/pdf")
async def download_pdf(report_id: str, user: dict = Depends(get_current_user)):
    """Generate and download PDF report."""
    report = get_report(report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    if report.get("userId") != user["uid"] and user.get("role") != "admin":
        raise HTTPException(403, "Access denied")

    settings = get_settings()
    report_dir = Path(settings.report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)

    qr_token = report.get("qrToken", str(uuid.uuid4()))
    pdf_path = report_dir / f"report_{report_id}.pdf"

    generate_pdf_report(
        report_data=report,
        output_path=str(pdf_path),
        qr_token=qr_token,
        annotated_image_path=report.get("annotatedImagePath"),
    )

    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        filename=f"coral_reef_report_{report_id[:8]}.pdf",
    )


@router.get("/{report_id}/csv")
async def export_csv(report_id: str, user: dict = Depends(get_current_user)):
    """Export report data as CSV."""
    report = get_report(report_id)
    if not report:
        raise HTTPException(404, "Report not found")
    if report.get("userId") != user["uid"] and user.get("role") != "admin":
        raise HTTPException(403, "Access denied")

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Report ID", report_id])
    writer.writerow(["File", report.get("fileName", "")])
    writer.writerow(["Healthy Coral %", report.get("healthyCoralPct", 0)])
    writer.writerow(["Bleached Coral %", report.get("bleachedCoralPct", 0)])
    writer.writerow(["Dead Coral %", report.get("deadCoralPct", 0)])
    writer.writerow(["Algae %", report.get("algaePct", 0)])
    writer.writerow(["Sand %", report.get("sandPct", 0)])
    writer.writerow(["Rock %", report.get("rockPct", 0)])
    writer.writerow(["Bleaching Index", report.get("bleachingPercentage", 0)])
    writer.writerow(["Risk Level", report.get("riskLevel", "")])
    writer.writerow(["Created At", report.get("createdAt", "")])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id[:8]}.csv"},
    )


@router.get("/compare/history")
async def historical_comparison(user: dict = Depends(get_current_user)):
    """Compare user's historical analyses."""
    from app.core.firebase import list_user_analyses

    analyses = list_user_analyses(user["uid"])
    if len(analyses) < 2:
        return {"message": "Need at least 2 analyses for comparison", "comparisons": []}

    comparisons = []
    for i in range(1, min(len(analyses), 10)):
        curr = analyses[i - 1]
        prev = analyses[i]
        comparisons.append({
            "current": {"id": curr.get("analysisId"), "date": curr.get("createdAt"), "healthy": curr.get("healthyCoralPct"), "bleached": curr.get("bleachedCoralPct")},
            "previous": {"id": prev.get("analysisId"), "date": prev.get("createdAt"), "healthy": prev.get("healthyCoralPct"), "bleached": prev.get("bleachedCoralPct")},
            "healthyDelta": round(curr.get("healthyCoralPct", 0) - prev.get("healthyCoralPct", 0), 2),
            "bleachedDelta": round(curr.get("bleachedCoralPct", 0) - prev.get("bleachedCoralPct", 0), 2),
        })

    return {"comparisons": comparisons, "total": len(comparisons)}
