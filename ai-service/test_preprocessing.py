import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.image_service import ImagePreprocessingService

def main():
    input_path = "test.jpg"
    output_path = "test_enhanced.jpg"

    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    print(f"Reading {input_path}...")
    with open(input_path, "rb") as f:
        image_bytes = f.read()

    print("Running OpenCV enhancement pipeline (grayscale, median blur, CLAHE contrast, sharpening, deskew)...")
    enhanced_bytes = ImagePreprocessingService.preprocess_for_ocr(image_bytes)

    print(f"Saving to {output_path}...")
    with open(output_path, "wb") as f:
        f.write(enhanced_bytes)

    print("Done! Open test_enhanced.jpg to see the results.")

if __name__ == "__main__":
    main()
