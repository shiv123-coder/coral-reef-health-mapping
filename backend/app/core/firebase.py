"""Firebase Admin SDK initialization and Firestore helpers."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import firebase_admin
from firebase_admin import auth, credentials, firestore

from app.config import get_settings

_db = None
_initialized = False


def init_firebase():
    """Initialize Firebase Admin SDK once."""
    global _db, _initialized
    if _initialized:
        return _db

    settings = get_settings()
    cred_dict = settings.firebase_credentials_dict

    if cred_dict:
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})
    else:
        # Allow startup without Firebase for local ML-only testing
        print("Firebase credentials not configured — auth/db disabled until .env.production is set")
        _initialized = True
        return None

    _db = firestore.client()
    _initialized = True
    return _db


def get_db():
    if _db is None:
        return init_firebase()
    return _db


def verify_firebase_token(id_token: str) -> dict:
    """Verify Firebase ID token and return decoded claims."""
    return auth.verify_id_token(id_token)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def generate_qr_token() -> str:
    return uuid.uuid4().hex


# --- Firestore CRUD helpers ---

def create_user_profile(uid: str, data: dict) -> dict:
    db = get_db()
    if db is None:
        return data
    doc = {**data, "uid": uid, "createdAt": utc_now_iso(), "updatedAt": utc_now_iso()}
    db.collection("users").document(uid).set(doc)
    return doc


def get_user_profile(uid: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = db.collection("users").document(uid).get()
    return doc.to_dict() if doc.exists else None


def get_user_profile_by_email(email: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    docs = db.collection("users").where("email", "==", email).limit(1).stream()
    for doc in docs:
        return doc.to_dict()
    return None


def update_user_profile(uid: str, data: dict) -> dict:
    db = get_db()
    if db is None:
        return data
    data["updatedAt"] = utc_now_iso()
    db.collection("users").document(uid).update(data)
    return data


def delete_user_profile(uid: str) -> bool:
    db = get_db()
    if db is None:
        return False
    # Delete from Firestore
    db.collection("users").document(uid).delete()
    # Try to delete from Firebase Auth
    try:
        auth.delete_user(uid)
    except Exception as e:
        print(f"Failed to delete auth user {uid}: {e}")
    return True


def list_all_users() -> list:
    db = get_db()
    if db is None:
        return []
    return [doc.to_dict() for doc in db.collection("users").stream()]


def save_analysis(analysis_id: str, data: dict) -> dict:
    db = get_db()
    if db is None:
        return data
    data["createdAt"] = utc_now_iso()
    db.collection("analyses").document(analysis_id).set(data)
    return data


def get_analysis(analysis_id: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = db.collection("analyses").document(analysis_id).get()
    return doc.to_dict() if doc.exists else None


def list_user_analyses(user_id: str) -> list:
    db = get_db()
    if db is None:
        return []
    docs = (
        db.collection("analyses")
        .where("userId", "==", user_id)
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .stream()
    )
    return [doc.to_dict() for doc in docs]


def list_all_analyses() -> list:
    db = get_db()
    if db is None:
        return []
    return [doc.to_dict() for doc in db.collection("analyses").stream()]


def save_report(report_id: str, data: dict) -> dict:
    db = get_db()
    if db is None:
        return data
    data["updatedAt"] = utc_now_iso()
    if "createdAt" not in data:
        data["createdAt"] = utc_now_iso()
    db.collection("reports").document(report_id).set(data, merge=True)
    return data


def get_report(report_id: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = db.collection("reports").document(report_id).get()
    return doc.to_dict() if doc.exists else None


def save_public_report(qr_token: str, data: dict) -> dict:
    db = get_db()
    if db is None:
        return data
    db.collection("public_reports").document(qr_token).set(data)
    return data


def get_public_report(qr_token: str) -> Optional[dict]:
    db = get_db()
    if db is None:
        return None
    doc = db.collection("public_reports").document(qr_token).get()
    return doc.to_dict() if doc.exists else None


def get_user_dashboard_stats(user_id: str) -> dict:
    """Aggregate stats for user dashboard."""
    analyses = list_user_analyses(user_id)
    if not analyses:
        return {
            "totalAnalyses": 0,
            "healthyCoralPct": 0,
            "bleachedCoralPct": 0,
            "deadCoralPct": 0,
            "algaePct": 0,
            "riskLevel": "N/A",
            "history": [],
        }

    n = len(analyses)
    healthy = sum(a.get("healthyCoralPct", 0) for a in analyses) / n
    bleached = sum(a.get("bleachedCoralPct", 0) for a in analyses) / n
    dead = sum(a.get("deadCoralPct", 0) for a in analyses) / n
    algae = sum(a.get("algaePct", 0) for a in analyses) / n

    risk_levels = [a.get("riskLevel", "Minimal") for a in analyses]
    risk_priority = {"Critical": 4, "High": 3, "Moderate": 2, "Low": 1, "Minimal": 0}
    worst_risk = max(risk_levels, key=lambda r: risk_priority.get(r, 0))

    return {
        "totalAnalyses": n,
        "healthyCoralPct": round(healthy, 2),
        "bleachedCoralPct": round(bleached, 2),
        "deadCoralPct": round(dead, 2),
        "algaePct": round(algae, 2),
        "riskLevel": worst_risk,
        "history": analyses[:20],
    }


def get_system_analytics() -> dict:
    """Admin system-wide analytics."""
    users = list_all_users()
    analyses = list_all_analyses()
    return {
        "totalUsers": len(users),
        "totalAnalyses": len(analyses),
        "usersByRole": _count_by_key(users, "role"),
        "analysesByRisk": _count_by_key(analyses, "riskLevel"),
        "recentAnalyses": sorted(analyses, key=lambda x: x.get("createdAt", ""), reverse=True)[:10],
    }


def _count_by_key(items: list, key: str) -> dict:
    counts = {}
    for item in items:
        val = item.get(key, "unknown")
        counts[val] = counts.get(val, 0) + 1
    return counts

def create_notification(user_id: str, title: str, message: str, notif_type: str = "info"):
    db = get_db()
    if db is None:
        return
    db.collection("notifications").add({
        "userId": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "isRead": False,
        "readBy": [],
        "createdAt": firestore.SERVER_TIMESTAMP
    })

def notify_admins(title: str, message: str, notif_type: str = "info"):
    db = get_db()
    if db is None:
        return
    users = list_all_users()
    for u in users:
        if u.get("role") == "admin":
            db.collection("notifications").add({
                "userId": u.get("uid"),
                "title": title,
                "message": message,
                "type": notif_type,
                "isRead": False,
                "readBy": [],
                "createdAt": firestore.SERVER_TIMESTAMP
            })
