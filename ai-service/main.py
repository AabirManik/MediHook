from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from schemas import PrescriptionAnalysisResponse

from services.image_service import ImagePreprocessingService
from providers.paddleocr_provider import PaddleOCRProvider
from services.prescription_parser import PrescriptionParser
from services.medicine_validator import MedicineValidator
from services.confidence_engine import ConfidenceEngine

# Initialize heavy providers and validators at boot
try:
    ocr_provider = PaddleOCRProvider()
    ocr_available = True
except Exception as e:
    print(f"Warning: OCR Provider failed to load: {e}")
    ocr_available = False
    
validator = MedicineValidator()

app = FastAPI(title="Sanjeev AI - ClearScript Intelligence Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Sanjeev AI OCR Pipeline", "ocr_available": ocr_available}

@app.post("/api/prescriptions/scan", response_model=PrescriptionAnalysisResponse)
async def scan_prescription(image: UploadFile = File(...)):
    """
    Main endpoint for parsing prescription images.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    if not ocr_available:
        return PrescriptionAnalysisResponse(
            medications=[],
            raw_text="PaddleOCR failed to initialize (AppLocker/Missing Libs).",
            overall_confidence=0.0,
            warnings=["AI Pipeline is running in mock mode due to local environment restrictions."],
            scan_status="FAILED"
        )
        
    try:
        # Read raw bytes
        raw_bytes = await image.read()
        
        # 1. Preprocess
        enhanced_bytes = ImagePreprocessingService.preprocess_for_ocr(raw_bytes)
        
        # 2. Extract Text via OCR
        ocr_result = ocr_provider.extract_text(enhanced_bytes)
        raw_text = ocr_result["text"]
        
        # 3. Parse components
        parsed_meds = PrescriptionParser.parse_text(raw_text)
        
        final_medications = []
        
        # 4. Validate & Score
        for pm in parsed_meds:
            # We assume a base OCR confidence for the line if we don't map exact bounding boxes yet
            base_ocr_conf = 85.0 
            
            validation = validator.validate_medicine(pm["candidate_name"])
            
            overall_conf = ConfidenceEngine.calculate_overall_confidence(
                ocr_confidence=base_ocr_conf,
                medicine_match_confidence=validation["confidence"],
                parser_confidence=pm["parser_confidence"]
            )
            
            final_medications.append({
                "raw_text": pm["raw_text"],
                "candidate_name": validation["candidate_name"],
                "dosage": pm["dosage"],
                "frequency": pm["frequency"],
                "instructions": pm["instructions"],
                "ocr_confidence": base_ocr_conf,
                "medicine_match_confidence": validation["confidence"],
                "overall_confidence": overall_conf,
                "requires_confirmation": validation["requires_confirmation"]
            })
            
        pipeline_conf = sum(m["overall_confidence"] for m in final_medications) / len(final_medications) if final_medications else 0.0
            
        return PrescriptionAnalysisResponse(
            medications=final_medications,
            raw_text=raw_text,
            overall_confidence=pipeline_conf,
            warnings=[],
            scan_status="SUCCESS"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
