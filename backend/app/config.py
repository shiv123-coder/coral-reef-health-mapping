"""Application configuration from environment variables."""

import json
import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load production env from project root
ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env.production")


class Settings(BaseSettings):
    api_base_url: str = os.getenv("API_BASE_URL", "")
    frontend_url: str = os.getenv("FRONTEND_URL", "")
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: str = os.getenv("CORS_ORIGINS", "")

    firebase_project_id: str = os.getenv("FIREBASE_PROJECT_ID", "")
    firebase_service_account_json: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    firebase_service_account_path: str = os.getenv(
        "FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json"
    )

    model_dir: str = os.getenv("MODEL_DIR", str(ROOT / "ml" / "weights"))
    upload_dir: str = os.getenv("UPLOAD_DIR", str(ROOT / "uploads"))
    report_dir: str = os.getenv("REPORT_DIR", str(ROOT / "reports"))

    admin_email: str = os.getenv("ADMIN_EMAIL", "shivashankrmali7@gmail.com")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "Shivmali@123")

    inference_device: str = os.getenv("INFERENCE_DEVICE", "cpu")
    confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
    max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))

    public_report_base_url: str = os.getenv(
        "VITE_PUBLIC_REPORT_BASE_URL",
        os.getenv("FRONTEND_URL", "") + "/public/report",
    )

    cloudinary_cloud_name: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    cloudinary_api_key: str = os.getenv("CLOUDINARY_API_KEY", "")
    cloudinary_api_secret: str = os.getenv("CLOUDINARY_API_SECRET", "")

    @property
    def cors_origin_list(self) -> list:
        if not self.cors_origins:
            return []
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def firebase_credentials_dict(self) -> dict:
        if self.firebase_service_account_json:
            return json.loads(self.firebase_service_account_json)
        path = Path(self.firebase_service_account_path)
        if not path.is_absolute():
            path = ROOT / "backend" / path
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        return {}

    class Config:
        env_file = ".env.production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
