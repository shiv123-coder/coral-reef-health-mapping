"""Authentication routes — user registration profile creation."""

from fastapi import APIRouter, Depends, HTTPException

from app.core.firebase import create_user_profile, get_user_profile, verify_firebase_token
from app.core.security import get_current_user
from app.models.schemas import MessageResponse, UserRegisterRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=MessageResponse)
async def register_user(body: UserRegisterRequest):
    """
    Complete sign-up flow: verify Firebase token, store extended profile in Firestore.
    Firebase Auth account must already be created on frontend before calling this.
    """
    try:
        decoded = verify_firebase_token(body.idToken)
        uid = decoded["uid"]

        if decoded.get("email") != body.email:
            raise HTTPException(400, "Email mismatch with token")

        existing = get_user_profile(uid)
        if existing:
            raise HTTPException(409, "User profile already exists")

        profile = create_user_profile(uid, {
            "email": body.email,
            "firstName": body.firstName,
            "lastName": body.lastName,
            "organization": body.organization,
            "role": body.role,
            "phone": body.phone or "",
            "department": body.department or "",
            "country": body.country or "",
        })

        return MessageResponse(message="Registration successful", success=True)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Registration failed: {str(e)}")


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return user
