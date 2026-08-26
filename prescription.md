# 🩺 Sanjeev AI — ClearScript Prescription Intelligence System

## Mission

Upgrade the existing Sanjeev AI prescription scanner from a frontend/demo scanner into a real AI-powered prescription intelligence pipeline.

The application already has its frontend UI/UX implemented.

IMPORTANT:

DO NOT redesign the existing Sanjeev AI application.

DO NOT replace the current design system.

DO NOT create a new scanner UI unless absolutely necessary.

DO NOT change existing navigation unnecessarily.

The existing prescription scanner, ClearScript page, medication pages, and risk analysis UI should remain visually consistent with the current application.

The objective is to connect the existing UI to a real backend AI pipeline.

---

# 1. Primary Goal

Build a real prescription processing system capable of:

1. Accepting a prescription image.
2. Performing image preprocessing.
3. Extracting visible prescription text using OCR.
4. Structuring detected prescription information.
5. Identifying possible medicine names.
6. Extracting dosage information.
7. Extracting frequency information.
8. Extracting duration if available.
9. Extracting instructions if available.
10. Calculating transparent confidence levels.
11. Validating medicine names against a known medicine dataset.
12. Never silently inventing uncertain medicine names.
13. Sending uncertain results to human confirmation.
14. Saving confirmed prescriptions to Supabase.

The final system should power the existing ClearScript feature.

---

# 2. Required Architecture

Implement the following architecture:

Prescription Image
        ↓
Existing Sanjeev AI Scanner UI
        ↓
Client-side basic validation
        ↓
Secure Backend Upload
        ↓
Image Preprocessing
        ↓
PaddleOCR / PaddleOCR-VL
        ↓
Raw OCR Output
        ↓
Prescription Parser
        ↓
Medicine Candidate Detection
        ↓
Medicine Validation Layer
        ↓
ClearScript Confidence Engine
        ↓
┌───────────────────────────────────────┐
│ HIGH CONFIDENCE                       │
│ Auto-suggest, but still display       │
│ extracted result clearly              │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ MEDIUM CONFIDENCE                     │
│ User must review/edit/confirm         │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│ LOW CONFIDENCE                        │
│ Do not guess                          │
│ Require manual input                  │
└───────────────────────────────────────┘
        ↓
User Confirmation
        ↓
Supabase Database
        ↓
Existing Medication System
        ↓
Existing Drug Interaction Engine

---

# 3. AI Technology

Use open-source self-hosted technology.

Primary OCR/document parsing engine:

PaddleOCR

Preferred advanced document understanding option:

PaddleOCR-VL

The implementation must be modular.

Create an AI provider abstraction so the OCR engine can be replaced later without rewriting the entire application.

For example:

ai-service/
    providers/
        paddleocr_provider.py
        base_provider.py

Do not hardcode the entire application around a single AI provider.

---

# 4. Backend Architecture

Inspect the existing Sanjeev AI backend before creating new services.

Determine whether the existing server should be extended or whether a separate Python AI service is cleaner.

Preferred architecture:

Existing Frontend
       ↓
Existing Node.js API / Gateway
       ↓
Python FastAPI AI Service
       ↓
PaddleOCR / PaddleOCR-VL

The Python service should be responsible for AI inference.

The existing Node.js backend may act as an API gateway if that matches the existing repository architecture.

Do not unnecessarily rewrite the existing backend.

---

# 5. Create a Python AI Service

Create a separate service directory if the repository structure requires it:

ai-service/
    app/
        main.py
        config.py
        schemas.py

        services/
            image_service.py
            ocr_service.py
            prescription_parser.py
            medicine_validator.py
            confidence_service.py

        providers/
            base_provider.py
            paddleocr_provider.py

        data/
            medicine_reference.json

        requirements.txt
        README.md

The exact structure can be adapted to the existing repository.

Do not duplicate functionality unnecessarily.

---

# 6. API Endpoint

Implement a secure prescription scanning endpoint.

Example:

POST

/api/prescriptions/scan

The request should accept:

multipart/form-data

with:

image

The backend should validate:

- Authentication
- File type
- File size
- Image validity

Allowed image formats:

- JPEG
- JPG
- PNG
- WEBP

Reject:

- Executable files
- Unsupported file types
- Excessively large files

---

# 7. Image Preprocessing Pipeline

Before OCR, implement preprocessing.

The system should attempt to improve difficult prescription images using techniques such as:

1. Image orientation correction
2. Deskewing
3. Contrast enhancement
4. Noise reduction
5. Brightness normalization
6. Optional sharpening
7. Image resizing when necessary

IMPORTANT:

Do not over-process images.

The original image should remain available for comparison.

Store preprocessing metadata if useful for debugging.

---

# 8. OCR Processing

The OCR layer should return raw information including:

- Extracted text
- Bounding boxes when available
- OCR confidence when available
- Processing errors
- Model/provider metadata

Do not immediately treat OCR output as clinically correct.

OCR output is only the first stage.

---

# 9. Prescription Parser

Create a parser that converts raw OCR output into structured data.

Target structure:

{
  "medications": [
    {
      "raw_text": "",
      "candidate_name": "",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "instructions": "",
      "ocr_confidence": 0,
      "medicine_match_confidence": 0,
      "overall_confidence": 0,
      "requires_confirmation": true
    }
  ],
  "raw_text": "",
  "warnings": []
}

Do not fabricate fields that are not visible.

If dosage is not detected:

dosage: null

If duration is not detected:

duration: null

If instructions are unclear:

instructions: null

Never generate medical information that does not exist in the prescription.

---

# 10. Medicine Validation Layer

Create a medicine validation layer.

OCR can incorrectly read medicine names.

Therefore:

OCR Candidate

↓

Medicine Reference Matching

↓

Possible Matches

↓

Confidence Score

The system should attempt:

1. Exact matching
2. Case-insensitive matching
3. Normalized string matching
4. Fuzzy matching
5. Generic name matching
6. Brand name matching where the dataset supports it

Example:

OCR:

Amoxicilin

Reference candidates:

Amoxicillin

The system may suggest:

Amoxicillin

But the confidence calculation must reflect that this was corrected from an OCR candidate.

Do not silently replace highly ambiguous medicines.

Example:

Candidate:

Met...

Possible results:

Metformin
Metoprolol
Metoclopramide

This must trigger confirmation instead of guessing.

---

# 11. ClearScript Confidence Engine

Preserve and improve the existing three-layer ClearScript system.

Confidence should NOT come from a single AI-generated number.

Calculate confidence using multiple signals.

Suggested factors:

OCR Confidence
+
Medicine Database Match Confidence
+
Dosage Pattern Confidence
+
Frequency Pattern Confidence
+
Parser Confidence

Example:

overall_confidence =
weighted combination of available signals

The implementation should document the weighting.

Do not falsely claim mathematical certainty.

---

# 12. ClearScript Confidence Rules

## HIGH CONFIDENCE

90% and above

Behavior:

- Display detected medicine.
- Display extracted dosage.
- Display frequency.
- Mark as high confidence.
- Allow the user to review.
- Allow editing before saving.

Do not silently save without user awareness.

---

## MEDIUM CONFIDENCE

60% to 89%

Behavior:

- Highlight uncertain fields.
- Show possible medicine candidates.
- Require user confirmation or editing.
- Do not automatically treat uncertain values as verified.

---

## LOW CONFIDENCE

Below 60%

Behavior:

- Do not guess.
- Clearly explain that the prescription could not be read reliably.
- Keep the original image visible.
- Ask the user to manually enter the medicine.
- Allow retrying with a clearer photograph.

---

# 13. Critical Healthcare Safety Rules

This is a healthcare-related application.

The system must never:

- Invent a medicine name.
- Invent a dosage.
- Invent a frequency.
- Invent a diagnosis.
- Claim clinical certainty.
- Tell a patient to start or stop medication.
- Automatically change a prescription.

The scanner is an information extraction tool.

All uncertain results must remain uncertain.

Always maintain a clear distinction between:

OCR Result

and

User Confirmed Data

---

# 14. User Confirmation

The existing ClearScript UI should be connected to the new backend.

The user should be able to:

- See the original prescription.
- See extracted medicines.
- See confidence levels.
- Edit medicine names.
- Edit dosage.
- Edit frequency.
- Add missing medicines.
- Remove incorrect medicines.
- Confirm final results.

Only confirmed data should enter the patient's active medication records.

---

# 15. Supabase Storage

Use Supabase Storage for prescription images.

Create a private bucket:

prescriptions

Recommended file structure:

user_id/
    prescription_id/
        original_image.jpg

Do not make prescription images publicly accessible.

The implementation must configure appropriate Storage policies.

A user must only be able to access their own prescription files unless explicit future caregiver permissions are implemented.

---

# 16. Database Design

Integrate with the existing Supabase schema.

Add or update prescription records as needed.

Suggested fields:

prescriptions

- id
- user_id
- source_type
- image_path
- raw_ocr_text
- scan_status
- overall_confidence
- created_at
- updated_at

Medication records should contain:

- id
- prescription_id
- user_id
- raw_detected_name
- confirmed_name
- generic_name
- dosage
- frequency
- duration
- instructions
- confidence
- confirmed_by_user
- created_at

Do not duplicate tables if equivalent tables already exist.

Inspect the existing Supabase schema first.

---

# 17. Scan Status System

Implement a clear state machine.

Possible states:

UPLOADED

↓

PROCESSING

↓

OCR_COMPLETE

↓

REQUIRES_REVIEW

↓

CONFIRMED

or

FAILED

The frontend should reflect these states using the existing design system.

---

# 18. Error Handling

Implement proper errors for:

- Invalid image
- Unsupported file type
- File too large
- OCR processing failure
- AI service unavailable
- Timeout
- No readable text
- No medicine detected

Do not return fake results when the AI service fails.

The user should receive an honest message.

Example:

"We could not reliably read this prescription. Please upload a clearer image or enter the medicines manually."

---

# 19. Existing UI Preservation

The current Sanjeev AI UI/UX is already implemented.

DO NOT:

- Replace the frontend framework.
- Redesign ClearScript.
- Replace existing navigation.
- Remove existing pages.
- Change the design system.
- Create an unrelated admin dashboard.

Connect backend functionality to the existing scanner and ClearScript pages.

---

# 20. Authentication Integration

The system must use the existing Supabase authentication.

Before processing:

Get the authenticated user.

The prescription must be associated with:

auth.uid()

Never trust a user_id sent directly by the frontend without verification.

---

# 21. API Security

Implement:

- Authentication checks
- File validation
- Request size limits
- Timeouts
- Error handling
- Rate limiting appropriate to the deployment
- Logging without exposing sensitive prescription data unnecessarily

Do not expose:

- Supabase secret keys
- Database credentials
- AI service credentials

in frontend JavaScript.

---

# 22. Testing

Create tests using:

1. Clear typed prescription.
2. Printed prescription.
3. Moderate quality handwriting.
4. Blurry prescription.
5. Rotated image.
6. Low-light image.
7. Prescription containing multiple medicines.
8. Prescription with an ambiguous medicine name.
9. Invalid file.
10. Empty image.

Test the confidence system.

The system must demonstrate:

High confidence

Medium confidence

Low confidence

Do not optimize tests only for perfect images.

---

# 23. Performance

For the hackathon version:

Prioritize:

1. Reliable extraction.
2. Honest uncertainty.
3. Reasonable response time.
4. Clear error handling.

Do not introduce unnecessary distributed infrastructure.

Start with a simple architecture that works.

---

# 24. Implementation Order

IMPORTANT:

Follow this order.

STEP 1

Inspect the existing repository.

Understand:

- scanner.js
- clearscript.js
- api.js
- server/
- existing Supabase integration
- medication data flow
- prescription data flow

Do not modify code before understanding these connections.

---

STEP 2

Explain:

- Existing scanner architecture.
- Existing ClearScript flow.
- Existing API flow.
- Existing medication storage.
- Files that will be changed.
- Files that will be added.

---

STEP 3

Propose the exact AI architecture.

Explain:

Frontend
↓
Backend
↓
AI Service
↓
Supabase Storage
↓
Supabase Database

---

STEP 4

Create the AI service.

Use:

Python
FastAPI
PaddleOCR or PaddleOCR-VL

Keep it modular.

---

STEP 5

Connect the existing frontend scanner.

Do not redesign it.

---

STEP 6

Implement ClearScript confidence calculation.

---

STEP 7

Connect the existing ClearScript review UI.

---

STEP 8

Connect confirmed results to Supabase.

---

STEP 9

Test the complete flow.

---

# 25. Required Final Demonstration

The final system should demonstrate:

Patient
↓
Uploads Prescription
↓
AI Processes Image
↓
Extracts Medicine Candidates
↓
Calculates Confidence
↓
ClearScript Review
↓
User Confirms
↓
Prescription Stored in Supabase
↓
Medication Appears in Existing Medication List
↓
Medication Can Be Used by Existing Drug Interaction System

---

# 26. Final Delivery Requirements

Before completing implementation, provide:

1. Files modified.
2. Files created.
3. Environment variables required.
4. Python dependencies required.
5. Commands to run locally.
6. Supabase configuration required.
7. Storage bucket configuration.
8. Database migration required.
9. Testing instructions.
10. Deployment requirements.

Do not mark the implementation complete until the full flow works end-to-end.

The goal is not a mock AI scanner.

The goal is a functioning, responsible prescription extraction system integrated into the existing Sanjeev AI application.