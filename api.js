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
  }
};
