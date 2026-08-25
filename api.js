const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : '/api';

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
    try {
      const resp = await fetch(`${BASE_URL}/users/${userId}/profile`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [Profile]:', err);
      throw err;
    }
  },

  // Emergency & Doctor Contacts
  getContacts: async (userId) => {
    try {
      const resp = await fetch(`${BASE_URL}/users/${userId}/contacts`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [getContacts]:', err);
      throw err;
    }
  },

  addContact: async (userId, contactData) => {
    try {
      const resp = await fetch(`${BASE_URL}/users/${userId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [addContact]:', err);
      throw err;
    }
  },

  // Prescriptions
  getPrescriptions: async (userId) => {
    try {
      const resp = await fetch(`${BASE_URL}/users/${userId}/prescriptions`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [getPrescriptions]:', err);
      throw err;
    }
  },

  addPrescription: async (userId, prescriptionData) => {
    try {
      const resp = await fetch(`${BASE_URL}/users/${userId}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [addPrescription]:', err);
      throw err;
    }
  },

  // Mood Logs
  getMoods: async (userId) => {
    try {
      const resp = await fetch(`${BASE_URL}/users/${userId}/moods`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [getMoods]:', err);
      throw err;
    }
  },

  addMood: async (userId, moodData) => {
    try {
      const resp = await fetch(`${BASE_URL}/users/${userId}/moods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moodData)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Server Error');
      return data;
    } catch (err) {
      console.error('API Error [addMood]:', err);
      throw err;
    }
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
