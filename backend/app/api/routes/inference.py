"""Inference routes — upload, live inference, video processing."""

import os
import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Request

from app.config import get_settings
from app.core.firebase import generate_qr_token, save_analysis, save_public_report, save_report, utc_now_iso
from app.core.security import get_current_user
from app.services.inference_service import inference_service
import cloudinary.uploader
from PIL import Image
from io import BytesIO

from app.main import limiter

router = APIRouter(prefix="/inference", tags=["Inference"])


def _allowed_file(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in {"jpg", "jpeg", "png", "webp", "mp4", "avi", "mov", "mkv"}


@router.post("/upload")
@limiter.limit("5/minute")
async def upload_and_analyze(
    request: Request,
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    user: dict = Depends(get_current_user),
):
    """Upload image or video, run AI pipeline, store results."""
    settings = get_settings()

    if not file.filename or not _allowed_file(file.filename):
        raise HTTPException(400, "Unsupported file type")

    analysis_id = str(uuid.uuid4())
    upload_dir = Path(settings.upload_dir) / user["uid"] / analysis_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = upload_dir / file.filename
    content = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(413, f"File exceeds {settings.max_upload_size_mb}MB limit")

    ext = file.filename.rsplit(".", 1)[-1].lower()
    is_video = ext in {"mp4", "avi", "mov", "mkv"}
    
    exif_verified = False
    if not is_video:
        try:
            img = Image.open(BytesIO(content))
            exif = img._getexif()
            if exif is not None:
                exif_verified = True
        except Exception:
            pass

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        if is_video:
            frames_dir = str(upload_dir / "frames")
            result = inference_service.analyze_video(str(file_path), frames_dir)
            file_type = "video"
        else:
            result = inference_service.analyze_image(str(file_path))
            file_type = "image"
    except Exception as e:
        raise HTTPException(500, f"Inference failed: {str(e)}")

    # Cloudinary Upload
    annotated_image_url = f"/api/v1/inference/files/{analysis_id}/annotated"
    annotated_local_path = result.get("annotated_image")
    
    if settings.cloudinary_cloud_name and annotated_local_path and os.path.exists(annotated_local_path):
        try:
            upload_result = cloudinary.uploader.upload(
                annotated_local_path,
                folder=f"coral_reef/{user['uid']}",
                public_id=f"{analysis_id}_annotated"
            )
            annotated_image_url = upload_result.get("secure_url")
            # Store the URL instead of the local path
            result["annotated_image"] = annotated_image_url
            
            # Optional: upload original file too
            if not is_video:
                cloudinary.uploader.upload(
                    str(file_path),
                    folder=f"coral_reef/{user['uid']}",
                    public_id=f"{analysis_id}_original"
                )
        except Exception as e:
            print(f"Cloudinary upload failed: {e}")

    qr_token = generate_qr_token()

    analysis_record = {
        "analysisId": analysis_id,
        "userId": user["uid"],
        "fileName": file.filename,
        "fileType": file_type,
        "exifVerified": exif_verified,
        "healthyCoralPct": result.get("healthy_coral_pct", 0),
        "bleachedCoralPct": result.get("bleached_coral_pct", 0),
        "deadCoralPct": result.get("dead_coral_pct", 0),
        "algaePct": result.get("algae_pct", 0),
        "sandPct": result.get("sand_pct", 0),
        "rockPct": result.get("rock_pct", 0),
        "bleachingPercentage": result.get("bleaching_percentage", 0),
        "riskLevel": result.get("risk_level", "Minimal"),
        "diseases": result.get("diseases", []),
        "detections": result.get("detections", []),
        "classification": result.get("classification", {}),
        "annotatedImagePath": result.get("annotated_image"),
        "latitude": latitude,
        "longitude": longitude,
        "qrToken": qr_token,
        "createdAt": utc_now_iso(),
    }

    save_analysis(analysis_id, analysis_record)

    # Create initial report
    report_id = str(uuid.uuid4())
    report_record = {
        **analysis_record,
        "reportId": report_id,
        "firstName": user.get("firstName", ""),
        "lastName": user.get("lastName", ""),
        "email": user.get("email", ""),
        "organization": user.get("organization", ""),
        "role": user.get("role", ""),
        "aiConclusion": None,
        "adminNotes": None,
        "adminOverride": False,
        "finalized": False,
    }
    save_report(report_id, report_record)

    # Public QR data
    save_public_report(qr_token, {
        "qrToken": qr_token,
        "reportId": report_id,
        "analysisId": analysis_id,
        "userId": user["uid"],
        "firstName": user.get("firstName", ""),
        "lastName": user.get("lastName", ""),
        "organization": user.get("organization", ""),
        "email": user.get("email", ""),
        "fileName": file.filename,
        "fileType": file_type,
        "fileUrl": f"/api/v1/inference/files/{analysis_id}/{file.filename}",
        "annotatedImageUrl": annotated_image_url,
        "healthyCoralPct": analysis_record["healthyCoralPct"],
        "bleachedCoralPct": analysis_record["bleachedCoralPct"],
        "deadCoralPct": analysis_record["deadCoralPct"],
        "algaePct": analysis_record["algaePct"],
        "riskLevel": analysis_record["riskLevel"],
        "createdAt": analysis_record["createdAt"],
    })

    return {
        "analysisId": analysis_id,
        "reportId": report_id,
        "qrToken": qr_token,
        **{k: analysis_record[k] for k in [
            "exifVerified", "healthyCoralPct", "bleachedCoralPct", "deadCoralPct", "algaePct",
            "bleachingPercentage", "riskLevel", "diseases", "detections", "classification",
        ]},
        "annotatedImageUrl": annotated_image_url,
    }


@router.post("/live")
async def live_inference(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Live camera inference — processes single frame without permanent storage."""
    settings = get_settings()
    temp_dir = Path(settings.upload_dir) / "live" / user["uid"]
    temp_dir.mkdir(parents=True, exist_ok=True)

    temp_path = temp_dir / f"{uuid.uuid4()}.jpg"
    content = await file.read()
    with open(temp_path, "wb") as f:
        f.write(content)

    try:
        result = inference_service.analyze_image(str(temp_path))
    finally:
        if temp_path.exists():
            temp_path.unlink()

    return {
        "healthyCoralPct": result.get("healthy_coral_pct", 0),
        "bleachedCoralPct": result.get("bleached_coral_pct", 0),
        "deadCoralPct": result.get("dead_coral_pct", 0),
        "algaePct": result.get("algae_pct", 0),
        "bleachingPercentage": result.get("bleaching_percentage", 0),
        "riskLevel": result.get("risk_level", "Minimal"),
        "diseases": result.get("diseases", []),
        "detections": result.get("detections", []),
        "classification": result.get("classification", {}),
    }


@router.get("/files/{analysis_id}/annotated")
async def get_annotated_image(analysis_id: str, user: dict = Depends(get_current_user)):
    """Serve annotated result image."""
    from app.core.firebase import get_analysis

    analysis = get_analysis(analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    if analysis["userId"] != user["uid"] and user.get("role") != "admin":
        raise HTTPException(403, "Access denied")

    path = analysis.get("annotatedImagePath")
    if not path:
        raise HTTPException(404, "Annotated image not found")
        
    # If the path is a Cloudinary URL, redirect to it
    if path.startswith("http"):
        from fastapi.responses import RedirectResponse
        return RedirectResponse(path)

    if not os.path.exists(path):
        raise HTTPException(404, "Annotated image not found locally")

    from fastapi.responses import FileResponse
    return FileResponse(path, media_type="image/jpeg")


@router.get("/history")
async def get_analysis_history(user: dict = Depends(get_current_user)):
    """User's analysis history."""
    from app.core.firebase import list_user_analyses
    return list_user_analyses(user["uid"])
