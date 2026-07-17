"""Authentication middleware and RBAC dependencies."""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import get_user_profile, verify_firebase_token

security = HTTPBearer(auto_error=False)

ROLES = ["admin", "researcher", "student", "viewer"]


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Extract and verify Firebase user from Bearer token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        decoded = verify_firebase_token(credentials.credentials)
        uid = decoded["uid"]
        profile = get_user_profile(uid)
        if profile is None:
            raise HTTPException(status_code=401, detail="User profile not found")
        return {"uid": uid, "email": decoded.get("email"), **profile}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    """RBAC: admin-only access."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """Optional auth for public endpoints."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
