"""Admin panel routes — RBAC protected."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.firebase import get_system_analytics, list_all_analyses, list_all_users, update_user_profile
from app.core.security import require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
async def admin_list_users(admin: dict = Depends(require_admin)):
    """List all registered users."""
    return {"users": list_all_users()}


@router.get("/analyses")
async def admin_list_analyses(admin: dict = Depends(require_admin)):
    """View ALL user-generated inputs globally."""
    return {"analyses": list_all_analyses()}


@router.get("/analytics")
async def admin_analytics(admin: dict = Depends(require_admin)):
    """System-wide analytics dashboard."""
    return get_system_analytics()


@router.put("/users/{uid}/role")
async def admin_update_role(uid: str, role: str, admin: dict = Depends(require_admin)):
    """Change user role."""
    if role not in ("admin", "researcher", "student", "viewer"):
        raise HTTPException(400, "Invalid role")
    update_user_profile(uid, {"role": role})
    return {"message": f"Role updated to {role}"}
