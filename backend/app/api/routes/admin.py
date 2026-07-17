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


from pydantic import BaseModel
from typing import Optional

class UserUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None

@router.put("/users/{uid}")
async def admin_update_user(uid: str, update: UserUpdate, admin: dict = Depends(require_admin)):
    """Update user profile."""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if "role" in update_data and update_data["role"] not in ("admin", "researcher", "student", "viewer"):
        raise HTTPException(400, "Invalid role")
        
    from app.core.firebase import update_user_profile
    update_user_profile(uid, update_data)
    return {"message": "User updated", "data": update_data}


@router.delete("/users/{uid}")
async def admin_delete_user(uid: str, admin: dict = Depends(require_admin)):
    """Delete a user."""
    from app.core.firebase import delete_user_profile
    success = delete_user_profile(uid)
    if not success:
        raise HTTPException(500, "Failed to delete user")
    return {"message": "User deleted"}
