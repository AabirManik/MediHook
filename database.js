import { supabase } from './supabase.js';

// Guard: Supabase requires a valid UUID. Mock/dev user IDs like "dev-user-001" will
// cause a 400 error. This helper lets all DB methods silently skip for non-UUID users.
const isValidUUID = (id) => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const db = {

  // --- Profile Operations ---
  getProfile: async (userId) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  },
  
  updateProfile: async (userId, updates) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select();
    if (error) throw error;
    return data;
  },

  getSafetyScore: async (userId) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('profiles').select('safety_score, score_updated_at').eq('id', userId).single();
    if (error) throw error;
    return data;
  },

  updateSafetyScore: async (userId, score) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('profiles').update({ safety_score: score, score_updated_at: new Date().toISOString() }).eq('id', userId).select('safety_score, score_updated_at');
    if (error) throw error;
    return data;
  },

  // --- Medication Operations ---
  getMedications: async (userId) => {
    if (!isValidUUID(userId)) return [];
    const { data, error } = await supabase.from('medications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addMedication: async (userId, medication) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('medications').insert([{ ...medication, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },

  // --- Mood Operations ---
  getMoods: async (userId) => {
    if (!isValidUUID(userId)) return [];
    const { data, error } = await supabase.from('mood_logs').select('*').eq('user_id', userId).order('recorded_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addMood: async (userId, mood) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('mood_logs').insert([{ ...mood, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },

  // --- Contacts Operations ---
  getContacts: async (userId) => {
    if (!isValidUUID(userId)) return [];
    const { data, error } = await supabase.from('contacts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addContact: async (userId, contact) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('contacts').insert([{ ...contact, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },

  // --- Prescriptions Operations ---
  getPrescriptions: async (userId) => {
    if (!isValidUUID(userId)) return [];
    const { data, error } = await supabase.from('prescriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addPrescription: async (userId, prescription) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('prescriptions').insert([{ ...prescription, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },

  uploadPrescriptionImage: async (userId, base64Image) => {
    if (!isValidUUID(userId)) return '';
    const fileName = `${userId}/${Date.now()}.jpg`;
    
    // Convert base64 to Blob for browser compatibility
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const { data, error } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, blob, { contentType: 'image/jpeg' });
      
    if (error) throw error;
    
    // Return the public URL
    const { data: publicUrlData } = supabase.storage.from('prescriptions').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  },

  // --- Health Timeline Operations ---
  getTimeline: async (userId) => {
    if (!isValidUUID(userId)) return [];
    const { data, error } = await supabase.from('health_timeline').select('*').eq('user_id', userId).order('event_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  addTimelineEvent: async (userId, event) => {
    if (!isValidUUID(userId)) return null;
    const { data, error } = await supabase.from('health_timeline').insert([{ ...event, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },
  
  // --- Risk Assessment / Symptoms (Future use via Supabase if needed, though they might still rely on existing backend APIs for Gemini processing) ---
  // ------------------------------------------------------------------
  // CAREGIVER INVITATIONS & RELATIONSHIPS
  // ------------------------------------------------------------------
  createCaregiverInvitation: async (patientId, caregiverEmail, caregiverName, relationship) => {
    const { data, error } = await supabase
      .from('patient_caregiver_invitations')
      .insert([{
        patient_id: patientId,
        caregiver_email: caregiverEmail,
        caregiver_name: caregiverName,
        relationship: relationship
      }])
      .select('invitation_token')
      .single();
    if (error) throw error;
    return data.invitation_token; // Return token so Node.js/frontend can generate the mock email link
  },

  getPatientInvitations: async (patientId) => {
    const { data, error } = await supabase
      .from('patient_caregiver_invitations')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  cancelInvitation: async (invitationId) => {
    const { error } = await supabase
      .from('patient_caregiver_invitations')
      .update({ status: 'CANCELLED' })
      .eq('id', invitationId);
    if (error) throw error;
  },

  getCaregiverInvitations: async () => {
    const { data, error } = await supabase
      .from('patient_caregiver_invitations')
      .select('*')
      .eq('status', 'PENDING');
    if (error) throw error;
    
    // Manually join profiles
    if (data.length > 0) {
      const pids = data.map(d => d.patient_id);
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', pids);
      const pMap = {};
      if (profs) profs.forEach(p => pMap[p.id] = p);
      data.forEach(d => { d.profiles = pMap[d.patient_id] || { full_name: 'Unknown Patient' }; });
    }
    return data;
  },

  acceptCaregiverInvitation: async (token) => {
    const { data, error } = await supabase.rpc('accept_caregiver_invitation', { invite_token: token });
    if (error) throw error;
    return data;
  },

  getConnectedPatients: async (caregiverId) => {
    const { data, error } = await supabase
      .from('patient_caregivers')
      .select('patient_id, relationship, status')
      .eq('caregiver_id', caregiverId)
      .eq('status', 'ACTIVE');
    if (error) throw error;
    
    if (data.length > 0) {
      const pids = data.map(d => d.patient_id);
      const { data: profs } = await supabase.from('profiles').select('id, full_name, health_id').in('id', pids);
      const pMap = {};
      if (profs) profs.forEach(p => pMap[p.id] = p);
      data.forEach(d => { d.profiles = pMap[d.patient_id] || { full_name: 'Unknown Patient', health_id: 'UNKNOWN' }; });
    }
    return data;
  },

  getConnectedCaregivers: async (patientId) => {
    const { data, error } = await supabase
      .from('patient_caregivers')
      .select('caregiver_id, relationship, status')
      .eq('patient_id', patientId)
      .eq('status', 'ACTIVE');
    if (error) throw error;
    
    if (data.length > 0) {
      const cids = data.map(d => d.caregiver_id);
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', cids);
      const pMap = {};
      if (profs) profs.forEach(p => pMap[p.id] = p);
      data.forEach(d => { d.profiles = pMap[d.caregiver_id] || { full_name: 'Unknown Caregiver' }; });
    }
    return data;
  },

  revokeCaregiver: async (patientId, caregiverId) => {
    const { error } = await supabase
      .from('patient_caregivers')
      .update({ status: 'REVOKED' })
      .eq('patient_id', patientId)
      .eq('caregiver_id', caregiverId);
    if (error) throw error;
  },

  getPatientPrescriptionsForCaregiver: async (patientId) => {
    if (!isValidUUID(patientId)) return [];
    const { data, error } = await supabase.rpc('get_patient_prescriptions_for_caregiver', { p_patient_id: patientId });
    if (error) throw error;
    return data || [];
  },

  // ------------------------------------------------------------------
  // SOS SYSTEM
  // ------------------------------------------------------------------
  triggerSOS: async (patientId, message) => {
    const { data, error } = await supabase
      .from('sos_events')
      .insert([{
        patient_id: patientId,
        message: message || 'EMERGENCY SOS TRIGGERED'
      }])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  getActiveSOSEvents: async () => {
    const { data, error } = await supabase
      .from('sos_events')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });
    if (error) throw error;
    
    if (data.length > 0) {
      const pids = data.map(d => d.patient_id);
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', pids);
      const pMap = {};
      if (profs) profs.forEach(p => pMap[p.id] = p);
      data.forEach(d => { d.profiles = pMap[d.patient_id] || { full_name: 'Unknown Patient' }; });
    }
    return data;
  },

  acknowledgeSOS: async (sosId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('sos_events')
      .update({ 
        status: 'ACKNOWLEDGED', 
        acknowledged_by: user.id, 
        acknowledged_at: new Date().toISOString() 
      })
      .eq('id', sosId);
    if (error) throw error;
  },

  resolveSOS: async (sosId) => {
    const { error } = await supabase
      .from('sos_events')
      .update({ 
        status: 'RESOLVED', 
        resolved_at: new Date().toISOString() 
      })
      .eq('id', sosId);
    if (error) throw error;
  },

  subscribeToSOS: (callback) => {
    return supabase
      .channel('public:sos_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_events' }, payload => {
        callback(payload);
      })
      .subscribe();
  },

  // ------------------------------------------------------------------
  // SHARED REPORTS
  // ------------------------------------------------------------------
  shareReport: async (patientId, doctorId, reportData) => {
    if (!isValidUUID(patientId) || !isValidUUID(doctorId)) return null;
    const { data, error } = await supabase
      .from('shared_reports')
      .insert([{
        patient_id: patientId,
        doctor_id: doctorId,
        report_data: reportData,
        report_type: 'weekly'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getSharedReports: async (doctorId) => {
    if (!isValidUUID(doctorId)) return [];
    const { data, error } = await supabase
      .from('shared_reports')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    if (data.length > 0) {
      const pids = [...new Set(data.map(d => d.patient_id))];
      const { data: profs } = await supabase.from('profiles').select('id, full_name, health_id').in('id', pids);
      const pMap = {};
      if (profs) profs.forEach(p => pMap[p.id] = p);
      data.forEach(d => { d.patient = pMap[d.patient_id] || { full_name: 'Unknown Patient', health_id: 'UNKNOWN' }; });
    }
    return data;
  },

  markReportRead: async (reportId) => {
    const { error } = await supabase
      .from('shared_reports')
      .update({ read: true })
      .eq('id', reportId);
    if (error) throw error;
  }
};
