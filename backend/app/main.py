"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import cloudinary

from app.config import get_settings
from app.core.firebase import init_firebase, create_user_profile, get_user_profile
from app.api.routes import auth, inference, reports, dashboard, admin, public

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter


def seed_admin_account():
    """Seed hardcoded admin if Firebase is configured."""
    settings = get_settings()
    try:
        from firebase_admin import auth as fb_auth

        # Check if admin exists in Firebase Auth
        try:
            user_record = fb_auth.get_user_by_email(settings.admin_email)
            uid = user_record.uid
        except fb_auth.UserNotFoundError:
            user_record = fb_auth.create_user(
                email=settings.admin_email,
                password=settings.admin_password,
                display_name="System Admin",
            )
            uid = user_record.uid
            print(f"Admin Firebase Auth account created: {settings.admin_email}")

        profile = get_user_profile(uid)
        if not profile:
            create_user_profile(uid, {
                "email": settings.admin_email,
                "firstName": "Shiva",
                "lastName": "Mali",
                "organization": "SPPU Admin",
                "role": "admin",
                "phone": "",
                "department": "Administration",
                "country": "India",
            })
            print(f"Admin Firestore profile seeded")
        elif profile.get("role") != "admin":
            from app.core.firebase import update_user_profile
            update_user_profile(uid, {"role": "admin"})
    except Exception as e:
        print(f"Admin seed skipped: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.report_dir).mkdir(parents=True, exist_ok=True)
    init_firebase()
    
    if settings.cloudinary_cloud_name:
        cloudinary.config(
            cloud_name=settings.cloudinary_cloud_name,
            api_key=settings.cloudinary_api_key,
            api_secret=settings.cloudinary_api_secret,
            secure=True,
        )
        print("Cloudinary initialized")
        
    seed_admin_account()
    yield


app = FastAPI(
    title="Coral Reef Health Mapping API",
    description="Vision-Based Deep Learning Framework for Coral Reef Health Mapping",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    response = _rate_limit_exceeded_handler(request, exc)
    if isinstance(response, JSONResponse):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"UNHANDLED EXCEPTION: {exc}")
    traceback.print_exc()
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Server Error: {str(exc)}"}
    )
    # Explicitly add CORS headers just in case CORSMiddleware misses it
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(inference.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(public.router, prefix=API_PREFIX)


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "service": "coral-reef-mapping-api"}


@app.get("/")
async def root():
    return {"message": "Coral Reef Health Mapping API", "docs": "/docs"}
