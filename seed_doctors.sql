-- =============================================
-- SEED: 2 Doctor Accounts for MediHook
-- Run this in Supabase SQL Editor
-- =============================================

-- Doctor 1: Dr. Priya Sharma
-- Email: dr.priya.sharma@medihook.test
-- Password: Doc@Priya2026!

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  'authenticated', 'authenticated',
  'dr.priya.sharma@medihook.test',
  crypt('Doc@Priya2026!', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  jsonb_build_object('full_name', 'Dr. Priya Sharma')
);

INSERT INTO profiles (id, full_name, email, role, health_id)
VALUES (
  'a1b2c3d4-e5f6-4890-abcd-ef1234567890',
  'Dr. Priya Sharma', 'dr.priya.sharma@medihook.test',
  'doctor', 'SANJ-DR4821'
);


-- Doctor 2: Dr. Arjun Mehta
-- Email: dr.arjun.mehta@medihook.test
-- Password: Doc@Arjun2026!

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b2c3d4e5-f6a7-4901-bcde-f12345678901',
  'authenticated', 'authenticated',
  'dr.arjun.mehta@medihook.test',
  crypt('Doc@Arjun2026!', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', '',
  jsonb_build_object('full_name', 'Dr. Arjun Mehta')
);

INSERT INTO profiles (id, full_name, email, role, health_id)
VALUES (
  'b2c3d4e5-f6a7-4901-bcde-f12345678901',
  'Dr. Arjun Mehta', 'dr.arjun.mehta@medihook.test',
  'doctor', 'SANJ-DR7359'
);


-- Verify
SELECT id, full_name, email, role, health_id FROM profiles WHERE role = 'doctor';
