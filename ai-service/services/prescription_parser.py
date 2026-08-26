import re
from typing import List, Dict, Any

class PrescriptionParser:
    """
    Parses raw OCR text into structured medication components using Regex and rule-based logic.
    """
    
    # Common medical dosage abbreviations
    DOSAGE_PATTERN = re.compile(r'(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu|tab|cap|puff)s?)', re.IGNORECASE)
    
    # Common frequency patterns (e.g., 1+0+1, 1-1-1, bid, tid, qd)
    FREQUENCY_PATTERN = re.compile(r'(\b\d[+-]\d[+-]\d\b|\bbid\b|\btid\b|\bqid\b|\bod\b|twice a day|once a day)', re.IGNORECASE)
    
    # Common instruction patterns (e.g., PC, AC, after meal)
    INSTRUCTION_PATTERN = re.compile(r'(\bpc\b|\bac\b|after meal|before meal|empty stomach|at night)', re.IGNORECASE)

    @staticmethod
    def parse_text(raw_text: str) -> List[Dict[str, Any]]:
        """
        Takes a full raw text string and attempts to extract medications line by line.
        Returns a list of dictionaries containing extracted fields.
        """
        lines = raw_text.split('\n')
        medications = []
        
        # Flag to indicate we've reached the prescription section (usually after Rx)
        in_rx_section = False
        
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
                
            # Detect Start of Rx
            if re.match(r'^(rx|r\\x|r x)', line_clean.lower()):
                in_rx_section = True
                continue
                
            # If we haven't hit Rx yet, we might be reading doctor names or clinic info
            # We'll skip aggressive parsing unless the line looks very much like a drug
            if not in_rx_section and not PrescriptionParser.DOSAGE_PATTERN.search(line_clean):
                continue
            
            # Extract components
            dosage_match = PrescriptionParser.DOSAGE_PATTERN.search(line_clean)
            freq_match = PrescriptionParser.FREQUENCY_PATTERN.search(line_clean)
            inst_match = PrescriptionParser.INSTRUCTION_PATTERN.search(line_clean)
            
            dosage = dosage_match.group(1) if dosage_match else None
            frequency = freq_match.group(1) if freq_match else None
            instruction = inst_match.group(1) if inst_match else None
            
            # Remove the extracted parts from the line to isolate the medicine name
            med_name_raw = line_clean
            for match in filter(None, [dosage, frequency, instruction]):
                med_name_raw = med_name_raw.replace(match, "")
                
            # Clean up residual artifacts (e.g., trailing hyphens, dots, "Tab", "Cap")
            med_name_raw = re.sub(r'\b(tab|cap|syr|inj)\b\.?', '', med_name_raw, flags=re.IGNORECASE)
            med_name_clean = re.sub(r'[^a-zA-Z0-9\s-]', '', med_name_raw).strip()
            
            # If we have a plausible medicine name length
            if len(med_name_clean) > 2:
                # Calculate parser consistency score based on how many required elements were found
                components_found = sum(1 for x in [dosage, frequency, instruction] if x is not None)
                parser_confidence = 30 + (20 * components_found) # Base 30, up to 90
                
                medications.append({
                    "raw_text": line_clean,
                    "candidate_name": med_name_clean,
                    "dosage": dosage,
                    "frequency": frequency,
                    "instructions": instruction,
                    "parser_confidence": parser_confidence
                })
                
        return medications
