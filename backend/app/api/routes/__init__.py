"""
FastAPI route definitions.
Includes sub-routers for Authentication, Admin, Dashboard, ML Inference, and Reporting.
"""

from . import admin, auth, dashboard, inference, public, reports

__all__ = [
    "admin",
    "auth",
    "dashboard",
    "inference",
    "public",
    "reports"
]
