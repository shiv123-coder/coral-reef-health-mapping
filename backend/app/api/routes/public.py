"""Public routes — QR code report viewing (no auth required)."""

from fastapi import APIRouter, HTTPException

from app.core.firebase import get_public_report

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/report/{qr_token}")
async def public_report(qr_token: str):
    """Publicly viewable report data linked from QR code."""
    data = get_public_report(qr_token)
    if not data:
        raise HTTPException(404, "Report not found")
    return data
