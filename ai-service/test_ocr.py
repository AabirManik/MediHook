import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from providers.paddleocr_provider import PaddleOCRProvider
from services.image_service import ImagePreprocessingService

def main():
    image_path = "test.jpg"
    
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found.")
        return

    print("1. Initializing PaddleOCR Engine (this may download models if first time)...")
    try:
        ocr_provider = PaddleOCRProvider()
    except RuntimeError as e:
        print(f"Error initializing OCR: {e}")
        return

    print(f"\n2. Reading and preprocessing {image_path}...")
    with open(image_path, "rb") as f:
        image_bytes = f.read()
    
    enhanced_bytes = ImagePreprocessingService.preprocess_for_ocr(image_bytes)

    print("\n3. Extracting Text with PaddleOCR...")
    result = ocr_provider.extract_text(enhanced_bytes)
    
    print("\n================ EXTRACTED TEXT ================")
    print(result["text"])
    print("================================================")
    
    # Print the first block as an example of structured data
    if result["blocks"]:
        print("\nExample Data Block (First line detected):")
        print(result["blocks"][0])

if __name__ == "__main__":
    main()
