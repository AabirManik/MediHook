import logging
import numpy as np
import cv2
from typing import Dict, Any

# We import PaddleOCR inside a try-except to ensure the app doesn't crash 
# on boot if Paddle isn't fully installed yet.
try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except ImportError:
    PADDLE_AVAILABLE = False
    logging.warning("PaddleOCR is not installed. AI Service will not be able to process images.")

from .base_provider import BaseOCRProvider

class PaddleOCRProvider(BaseOCRProvider):
    def __init__(self):
        """
        Initializes the PaddleOCR engine.
        Downloads the inference models (ch_PP-OCRv4 or en_PP-OCRv3) to ~/.paddleocr automatically on first run.
        """
        if not PADDLE_AVAILABLE:
            raise RuntimeError("PaddleOCR library is missing. Run pip install paddlepaddle paddleocr")
        
        logging.info("Initializing PaddleOCR Engine...")
        # We use 'en' for English medical prescriptions. 
        # use_angle_cls=True helps with slightly rotated text lines.
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')

    def extract_text(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extracts text from image bytes using PaddleOCR.
        """
        # Convert bytes to numpy array for OpenCV, which Paddle expects
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("Invalid image bytes provided to OCR provider")

        # Run inference
        # The result is a list containing bounding boxes, texts, and confidence scores.
        # Format: [[[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], ('text', confidence)], ...]
        raw_result = self.ocr.ocr(img, cls=True)
        
        extracted_blocks = []
        full_text_lines = []

        # PaddleOCR sometimes returns None or empty lists if nothing is found
        if raw_result and raw_result[0]:
            for line in raw_result[0]:
                box = line[0]
                text = line[1][0]
                confidence = line[1][1]
                
                # Add to blocks
                extracted_blocks.append({
                    "box": box,
                    "text": text,
                    "confidence": float(confidence)
                })
                # Add to full text
                full_text_lines.append(text)

        full_text = "\n".join(full_text_lines)

        return {
            "text": full_text,
            "blocks": extracted_blocks,
            "provider": "PaddleOCR"
        }
