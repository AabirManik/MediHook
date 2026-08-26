import cv2
import numpy as np
import io
from typing import Tuple

class ImagePreprocessingService:
    @staticmethod
    def preprocess_for_ocr(image_bytes: bytes) -> bytes:
        """
        Takes raw image bytes, applies a series of document-enhancement 
        filters for better OCR extraction, and returns processed JPEG bytes.
        """
        # 1. Decode image from bytes
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image bytes")

        # 2. Resize if too large (preserves memory and speeds up OCR)
        max_dimension = 2000
        h, w = img.shape[:2]
        if max(h, w) > max_dimension:
            scale = max_dimension / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

        # 3. Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 4. Light Noise Reduction
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)

        # 5. Adaptive Thresholding (Creates a clean black/white document without heavy artifacts)
        # Using a large block size helps preserve handwriting strokes.
        thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                       cv2.THRESH_BINARY, 21, 10)

        # 6. Light dilation to reconnect faint pen strokes
        kernel = np.ones((2,2), np.uint8)
        sharpened = cv2.erode(thresh, kernel, iterations=1)

        # 7. Deskewing (Basic bounding box rotation detection)
        # We find all non-white pixels and compute the minimum rotated bounding box
        coords = np.column_stack(np.where(sharpened > 0))
        if len(coords) > 0:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            
            # Only correct if the angle is significant but not intentional layout
            if abs(angle) > 0.5 and abs(angle) < 15:
                (h, w) = sharpened.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                sharpened = cv2.warpAffine(sharpened, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

        # Encode back to bytes
        is_success, buffer = cv2.imencode(".jpg", sharpened)
        if not is_success:
            raise ValueError("Failed to encode processed image")
            
        return buffer.tobytes()
