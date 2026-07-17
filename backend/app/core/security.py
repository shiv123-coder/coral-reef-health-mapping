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
        email = decoded.get("email")
        
        # Try getting profile by UID
        profile = get_user_profile(uid)
        
        # If not found, but we have an email (e.g. Google Login creates a different UID), look up by email
        if profile is None and email:
            from app.core.firebase import get_user_profile_by_email, create_user_profile
            existing_profile = get_user_profile_by_email(email)
            if existing_profile:
                # Enforce admin role if it's the admin email
                if email == "shivashankrmali7@gmail.com" and existing_profile.get("role") != "admin":
                    from app.core.firebase import update_user_profile
                    existing_profile["role"] = "admin"
                    update_user_profile(existing_profile["uid"], {"role": "admin"})

                # Clone it to the new UID to keep them in sync
                profile = create_user_profile(uid, existing_profile)
            else:
                # Auto-register if no profile exists at all
                profile = create_user_profile(uid, {
                    "email": email,
                    "firstName": decoded.get("name", "User").split(" ")[0] if decoded.get("name") else "User",
                    "lastName": " ".join(decoded.get("name", "").split(" ")[1:]) if decoded.get("name") else "",
                    "role": "admin" if email == "shivashankrmali7@gmail.com" else "student",
                    "organization": "CoralAI",
                })
        elif profile and email == "shivashankrmali7@gmail.com" and profile.get("role") != "admin":
            # If profile WAS found directly by UID, but role is incorrect, patch it
            from app.core.firebase import update_user_profile
            profile["role"] = "admin"
            update_user_profile(uid, {"role": "admin"})
                
        if profile is None:
            raise HTTPException(status_code=401, detail="User profile not found")
            
        return {"uid": uid, "email": email, **profile}
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
