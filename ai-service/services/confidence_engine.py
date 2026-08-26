class ConfidenceEngine:
    """
    Calculates the final blended confidence score for a medication line,
    incorporating multiple signals as mandated by the architecture.
    """
    
    @staticmethod
    def calculate_overall_confidence(
        ocr_confidence: float, 
        medicine_match_confidence: float, 
        parser_confidence: float
    ) -> float:
        """
        Blends scores. The medicine name confidence is treated as a critical signal 
        and heavily weights the final category.
        """
        # Ensure values are strictly floats 0-100
        ocr = float(ocr_confidence * 100 if ocr_confidence <= 1 else ocr_confidence)
        med = float(medicine_match_confidence)
        parser = float(parser_confidence)
        
        # Weighted blend (Medicine match is most critical)
        # 50% Medicine Database Match
        # 30% Parser Consistency (Did it have dosage + frequency?)
        # 20% Raw OCR string visual confidence
        
        blended = (med * 0.50) + (parser * 0.30) + (ocr * 0.20)
        
        return round(blended, 2)
