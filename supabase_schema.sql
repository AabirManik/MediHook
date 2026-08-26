-- 1. Create Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('patient', 'caregiver', 'pharmacist')),
  health_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Create Medications Table
CREATE TABLE medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  medication TEXT NOT NULL,
  dosage TEXT,
  instructions TEXT,
  doctorName TEXT,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own medications" ON medications FOR ALL USING (auth.uid() = user_id);

-- 3. Create Mood Logs Table
CREATE TABLE mood_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  moodLevel INTEGER CHECK (moodLevel >= 1 AND moodLevel <= 5),
  notes TEXT,
  date TIMESTAMP WITH TIME ZONE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own moods" ON mood_logs FOR ALL USING (auth.uid() = user_id);

-- 4. Create Contacts Table
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  relation TEXT,
  phone TEXT,
  isSOS BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own contacts" ON contacts FOR ALL USING (auth.uid() = user_id);

-- 5. Create Prescriptions Table
CREATE TABLE prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  medication TEXT,
  dosage TEXT,
  instructions TEXT,
  doctorName TEXT,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own prescriptions" ON prescriptions FOR ALL USING (auth.uid() = user_id);

-- 6. Create Health Timeline Table
CREATE TABLE health_timeline (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT,
  description TEXT,
  event_type TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE health_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own timeline" ON health_timeline FOR ALL USING (auth.uid() = user_id);

-- 7. Patient-Caregiver Invitations
CREATE TABLE patient_caregiver_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  caregiver_email TEXT NOT NULL,
  caregiver_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED')) DEFAULT 'PENDING',
  invitation_token UUID DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  accepted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE patient_caregiver_invitations ENABLE ROW LEVEL SECURITY;
-- Patients can create their own invitations and view them
CREATE POLICY "Patients can create invites" ON patient_caregiver_invitations FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can view own invites" ON patient_caregiver_invitations FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can cancel invites" ON patient_caregiver_invitations FOR UPDATE USING (auth.uid() = patient_id);

-- Caregivers can view/update invitations where the email matches their profile email
CREATE POLICY "Caregivers can view invites for their email" ON patient_caregiver_invitations FOR SELECT USING (
  caregiver_email = (SELECT email FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Caregivers can update invites for their email" ON patient_caregiver_invitations FOR UPDATE USING (
  caregiver_email = (SELECT email FROM profiles WHERE id = auth.uid())
);


-- 8. Patient-Caregivers (Active Relationships)
CREATE TABLE patient_caregivers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  caregiver_id UUID REFERENCES auth.users(id) NOT NULL,
  relationship TEXT NOT NULL,
  status TEXT CHECK (status IN ('ACTIVE', 'REVOKED')) DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(patient_id, caregiver_id)
);

ALTER TABLE patient_caregivers ENABLE ROW LEVEL SECURITY;
-- Patients can view their caregivers and revoke access
CREATE POLICY "Patients can view caregivers" ON patient_caregivers FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Patients can revoke caregivers" ON patient_caregivers FOR UPDATE USING (auth.uid() = patient_id);
-- Caregivers can view their assigned patients
CREATE POLICY "Caregivers can view assigned patients" ON patient_caregivers FOR SELECT USING (auth.uid() = caregiver_id);
-- Note: NO INSERT POLICY. Inserts are only handled by secure backend logic upon invitation acceptance.


-- 9. SOS Events
CREATE TABLE sos_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED')) DEFAULT 'ACTIVE',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
-- Patients can create and manage their own SOS events
CREATE POLICY "Patients can insert SOS" ON sos_events FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can manage own SOS" ON sos_events FOR ALL USING (auth.uid() = patient_id);
-- Caregivers can view and acknowledge SOS events IF they have an ACTIVE relationship
CREATE POLICY "Caregivers can view SOS of assigned patients" ON sos_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_caregivers 
    WHERE patient_caregivers.patient_id = sos_events.patient_id 
    AND patient_caregivers.caregiver_id = auth.uid() 
    AND patient_caregivers.status = 'ACTIVE'
  )
);
CREATE POLICY "Caregivers can update SOS of assigned patients" ON sos_events FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM patient_caregivers 
    WHERE patient_caregivers.patient_id = sos_events.patient_id 
    AND patient_caregivers.caregiver_id = auth.uid() 
    AND patient_caregivers.status = 'ACTIVE'
  )
);
