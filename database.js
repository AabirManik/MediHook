import { supabase } from './supabase.js';

export const db = {
  // --- Profile Operations ---
  getProfile: async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  },
  
  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select();
    if (error) throw error;
    return data;
  },

  // --- Medication Operations ---
  getMedications: async (userId) => {
    const { data, error } = await supabase.from('medications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addMedication: async (userId, medication) => {
    const { data, error } = await supabase.from('medications').insert([{ ...medication, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },

  // --- Mood Operations ---
  getMoods: async (userId) => {
    const { data, error } = await supabase.from('mood_logs').select('*').eq('user_id', userId).order('recorded_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addMood: async (userId, mood) => {
    const { data, error } = await supabase.from('mood_logs').insert([{ ...mood, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },

  // --- Contacts Operations ---
  getContacts: async (userId) => {
    const { data, error } = await supabase.from('contacts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addContact: async (userId, contact) => {
    const { data, error } = await supabase.from('contacts').insert([{ ...contact, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },

  // --- Prescriptions Operations ---
  getPrescriptions: async (userId) => {
    const { data, error } = await supabase.from('prescriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  addPrescription: async (userId, prescription) => {
    const { data, error } = await supabase.from('prescriptions').insert([{ ...prescription, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },

  uploadPrescriptionImage: async (userId, base64Image) => {
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
    const { data, error } = await supabase.from('health_timeline').select('*').eq('user_id', userId).order('event_date', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  addTimelineEvent: async (userId, event) => {
    const { data, error } = await supabase.from('health_timeline').insert([{ ...event, user_id: userId }]).select();
    if (error) throw error;
    return data;
  },
  
  // --- Risk Assessment / Symptoms (Future use via Supabase if needed, though they might still rely on existing backend APIs for Gemini processing) ---
};
