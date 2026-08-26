const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : '/api';

import { db } from './database.js';
import { auth } from './auth.js';

// ----------------------------------------------------
// FRONTEND API CLIENT
// ----------------------------------------------------
export const api = {
  // Authentication -> Matches Express Server
  register: async (name, role, passkey) => {
    try {
      const resp = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, passkey })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [Register]:', err);
      throw err;
    }
  },

  login: async (role, passkey) => {
    try {
      const resp = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, passkey })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [Login]:', err);
      throw err;
    }
  },

  googleLogin: async (credential, role) => {
    try {
      const resp = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, role })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [googleLogin]:', err);
      throw err;
    }
  },

  // Profile Data Fetching
  getProfile: async (userId) => {
    return await db.getProfile(userId);
  },

  // Emergency & Doctor Contacts
  getContacts: async (userId) => {
    return await db.getContacts(userId);
  },

  addContact: async (userId, contactData) => {
    return await db.addContact(userId, contactData);
  },

  // Prescriptions
  getPrescriptions: async (userId) => {
    return await db.getPrescriptions(userId);
  },

  addPrescription: async (userId, prescriptionData) => {
    return await db.addPrescription(userId, prescriptionData);
  },

  uploadPrescriptionImage: async (userId, base64Image) => {
    return await db.uploadPrescriptionImage(userId, base64Image);
  },

  // Mood Logs
  getMoods: async (userId) => {
    return await db.getMoods(userId);
  },

  addMood: async (userId, moodData) => {
    return await db.addMood(userId, moodData);
  },

  // Scanner & Interactions
  scanPrescription: async (rawText, image) => {
    try {
      const resp = await fetch(`${BASE_URL}/scan-prescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, image })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [scanPrescription]:', err);
      throw err;
    }
  },

  checkInteractions: async (medications) => {
    try {
      const resp = await fetch(`${BASE_URL}/check-interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medications })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [checkInteractions]:', err);
      throw err;
    }
  },

  analyzeSymptoms: async (userId, symptoms) => {
    try {
      const resp = await fetch(`${BASE_URL}/analyze-symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, symptoms })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [analyzeSymptoms]:', err);
      throw err;
    }
  },

  // ------------------------------------------------------------------
  // CAREGIVER & SOS SYSTEM (Delegating to db.js)
  // ------------------------------------------------------------------
  createCaregiverInvitation: async (patientId, caregiverEmail, caregiverName, relationship) => {
    return await db.createCaregiverInvitation(patientId, caregiverEmail, caregiverName, relationship);
  },
  
  getPatientInvitations: async (patientId) => {
    return await db.getPatientInvitations(patientId);
  },
  
  cancelInvitation: async (invitationId) => {
    return await db.cancelInvitation(invitationId);
  },
  
  getCaregiverInvitations: async () => {
    return await db.getCaregiverInvitations();
  },
  
  acceptCaregiverInvitation: async (token) => {
    return await db.acceptCaregiverInvitation(token);
  },
  
  getConnectedPatients: async (caregiverId) => {
    return await db.getConnectedPatients(caregiverId);
  },
  
  getConnectedCaregivers: async (patientId) => {
    return await db.getConnectedCaregivers(patientId);
  },
  
  revokeCaregiver: async (patientId, caregiverId) => {
    return await db.revokeCaregiver(patientId, caregiverId);
  },
  
  triggerSOS: async (patientId, message) => {
    return await db.triggerSOS(patientId, message);
  },
  
  getActiveSOSEvents: async () => {
    return await db.getActiveSOSEvents();
  },
  
  acknowledgeSOS: async (sosId) => {
    return await db.acknowledgeSOS(sosId);
  },
  
  resolveSOS: async (sosId) => {
    return await db.resolveSOS(sosId);
  },

  subscribeToSOS: (callback) => {
    return db.subscribeToSOS(callback);
  }
};
