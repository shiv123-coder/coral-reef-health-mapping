"""Dashboard routes."""

from fastapi import APIRouter, Depends

from app.core.firebase import get_user_dashboard_stats
from app.core.security import get_current_user
from app.models.schemas import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def dashboard_stats(user: dict = Depends(get_current_user)):
    """Personal dashboard statistics and history."""
    stats = get_user_dashboard_stats(user["uid"])
    return stats
