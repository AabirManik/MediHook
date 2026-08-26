from pydantic import BaseModel
from typing import List, Optional, Any

class MedicationCandidate(BaseModel):
    raw_text: str
    candidate_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    ocr_confidence: float
    medicine_match_confidence: float
    overall_confidence: float
    requires_confirmation: bool

class PrescriptionAnalysisResponse(BaseModel):
    medications: List[MedicationCandidate]
    raw_text: str
    overall_confidence: float
    warnings: List[str]
    scan_status: str
