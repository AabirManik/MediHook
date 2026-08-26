-- 10. Accept Invitation RPC (Server-side function bypassing RLS for safe relationship creation)
CREATE OR REPLACE FUNCTION accept_caregiver_invitation(invite_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite patient_caregiver_invitations%ROWTYPE;
  v_patient_id UUID;
  v_caregiver_email TEXT;
  v_caregiver_id UUID;
  v_relationship TEXT;
BEGIN
  -- 1. Get the caregiver's authenticated ID and email
  v_caregiver_id := auth.uid();
  IF v_caregiver_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_caregiver_email FROM auth.users WHERE id = v_caregiver_id;

  -- 2. Find the pending invitation
  SELECT * INTO v_invite 
  FROM patient_caregiver_invitations 
  WHERE invitation_token = invite_token AND status = 'PENDING' AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found, expired, or already processed';
  END IF;

  -- 3. Verify the email matches
  IF v_invite.caregiver_email != v_caregiver_email THEN
    RAISE EXCEPTION 'Authenticated email does not match invitation email';
  END IF;

  -- 4. Mark invitation as accepted
  UPDATE patient_caregiver_invitations 
  SET status = 'ACCEPTED', accepted_at = NOW() 
  WHERE id = v_invite.id;

  -- 5. Create the ACTIVE relationship
  INSERT INTO patient_caregivers (patient_id, caregiver_id, relationship, status)
  VALUES (v_invite.patient_id, v_caregiver_id, v_invite.relationship, 'ACTIVE')
  ON CONFLICT (patient_id, caregiver_id) 
  DO UPDATE SET status = 'ACTIVE', relationship = EXCLUDED.relationship, updated_at = NOW();

  RETURN TRUE;
END;
$$;
