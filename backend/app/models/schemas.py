"""Pydantic request/response models."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    idToken: str
    firstName: str = Field(..., min_length=1)
    lastName: str = Field(..., min_length=1)
    email: EmailStr
    organization: str = Field(..., min_length=1)
    role: str = Field(default="student", pattern="^(student|researcher|viewer)$")
    phone: Optional[str] = None
    department: Optional[str] = None
    country: Optional[str] = None


class ReportOverrideRequest(BaseModel):
    healthyCoralPct: Optional[float] = None
    bleachedCoralPct: Optional[float] = None
    deadCoralPct: Optional[float] = None
    algaePct: Optional[float] = None
    riskLevel: Optional[str] = None
    aiConclusion: Optional[str] = None
    adminNotes: Optional[str] = None
    finalized: bool = False


class AnalysisResponse(BaseModel):
    analysisId: str
    userId: str
    fileName: str
    fileType: str
    healthyCoralPct: float
    bleachedCoralPct: float
    deadCoralPct: float
    algaePct: float
    sandPct: float = 0
    rockPct: float = 0
    bleachingPercentage: float
    riskLevel: str
    diseases: List[Dict[str, Any]] = []
    detections: List[Dict[str, Any]] = []
    classification: Dict[str, Any] = {}
    annotatedImageUrl: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    createdAt: str


class DashboardStatsResponse(BaseModel):
    totalAnalyses: int
    healthyCoralPct: float
    bleachedCoralPct: float
    deadCoralPct: float
    algaePct: float
    riskLevel: str
    history: List[Dict[str, Any]] = []


class MessageResponse(BaseModel):
    message: str
    success: bool = True
