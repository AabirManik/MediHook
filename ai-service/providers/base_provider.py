from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseOCRProvider(ABC):
    @abstractmethod
    def extract_text(self, image_path_or_bytes) -> Dict[str, Any]:
        """
        Extracts text from an image.
        Must return a standardized dictionary containing:
        - 'text': The full extracted string
        - 'blocks': List of bounding boxes with text and confidence
        - 'provider': Name of the provider used
        """
        pass
