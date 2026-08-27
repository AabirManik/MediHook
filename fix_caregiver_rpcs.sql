-- =============================================
-- FIX: Caregiver RPCs with SECURITY DEFINER
-- Run this in Supabase SQL Editor
-- These bypass RLS so caregivers can read
-- connected patients' prescriptions + moods
-- =============================================

-- 1. Prescriptions for caregiver
CREATE OR REPLACE FUNCTION get_patient_prescriptions_for_caregiver(p_patient_id UUID)
RETURNS SETOF prescriptions
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT p.*
  FROM prescriptions p
  WHERE p.user_id = p_patient_id
    AND EXISTS (
      SELECT 1 FROM patient_caregivers pc
      WHERE pc.patient_id = p_patient_id
        AND pc.caregiver_id = auth.uid()
        AND pc.status = 'ACTIVE'
    );
$$;

-- 2. Mood logs for caregiver
CREATE OR REPLACE FUNCTION get_patient_moods_for_caregiver(p_patient_id UUID)
RETURNS SETOF mood_logs
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT m.*
  FROM mood_logs m
  WHERE m.user_id = p_patient_id
    AND EXISTS (
      SELECT 1 FROM patient_caregivers pc
      WHERE pc.patient_id = p_patient_id
        AND pc.caregiver_id = auth.uid()
        AND pc.status = 'ACTIVE'
    );
$$;

-- 3. Safety score for caregiver
CREATE OR REPLACE FUNCTION get_patient_safety_score_for_caregiver(p_patient_id UUID)
RETURNS TABLE(safety_score INTEGER, score_updated_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT pr.safety_score, pr.score_updated_at
  FROM profiles pr
  WHERE pr.id = p_patient_id
    AND EXISTS (
      SELECT 1 FROM patient_caregivers pc
      WHERE pc.patient_id = p_patient_id
        AND pc.caregiver_id = auth.uid()
        AND pc.status = 'ACTIVE'
    );
$$;
