import json
import os
from rapidfuzz import process, fuzz

class MedicineValidator:
    """
    Validates raw OCR candidate strings against a known medicine database using RapidFuzz.
    """
    def __init__(self):
        self.medicines = []
        self._load_database()
        
    def _load_database(self):
        file_path = os.path.join(os.path.dirname(__file__), "..", "data", "medicine_reference.json")
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                self.medicines = json.load(f)
        except Exception as e:
            print(f"Warning: Could not load medicine reference DB: {e}")
            self.medicines = []

    def validate_medicine(self, raw_name: str) -> dict:
        """
        Takes a raw extracted string and finds the best match in the database.
        Returns the match name and the confidence score (0-100).
        """
        if not raw_name or len(raw_name.strip()) < 3:
            return {"candidate_name": raw_name, "confidence": 0, "requires_confirmation": True}

        # Find best match using RapidFuzz
        # We use WRatio to handle minor typos and different string lengths well
        result = process.extractOne(
            raw_name, 
            self.medicines, 
            scorer=fuzz.WRatio
        )
        
        if result:
            best_match, score, _ = result
            
            # According to architecture: If the match is weak, we MUST require confirmation
            # and we must not silently choose an ambiguous medicine.
            if score < 65:
                return {
                    "candidate_name": raw_name, # Return original if we are unsure
                    "confidence": score,
                    "requires_confirmation": True,
                    "suggested_match": best_match
                }
            elif score >= 65 and score < 85:
                return {
                    "candidate_name": best_match,
                    "confidence": score,
                    "requires_confirmation": True
                }
            else:
                return {
                    "candidate_name": best_match,
                    "confidence": score,
                    "requires_confirmation": False
                }
        else:
            return {"candidate_name": raw_name, "confidence": 0, "requires_confirmation": True}
