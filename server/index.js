require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { User, Prescription, Mood, History, Contact } = require('./db.js');
const crypto = require('crypto');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Initialize Gemini and Google Auth
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSy_YOUR_API_KEY_HERE');
const GOOGLE_CLIENT_ID_FALLBACK = process.env.GOOGLE_CLIENT_ID || '597980671013-7jlpi4v0cvgdsdeso10mb2av0gbid17h.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID_FALLBACK);
const JWT_SECRET = process.env.JWT_SECRET || 'sanjeev_super_secret_key_123';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Generate a random mock Health ID
function generateHealthId() {
  return 'SANJ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// ----------------------------------------------------
// AUTHENTICATION API
// ----------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, role, passkey } = req.body;
    if (!name || !role || !passkey) {
      return res.status(400).json({ error: 'Please provide name, role, and passkey' });
    }

    const healthId = generateHealthId();
    const user = await User.create({ name, role, passkey, healthId });
    
    if (role === 'patient') {
      await History.create({
        userId: user._id,
        title: 'Initial Registration',
        date: new Date().toISOString().split('T')[0],
        description: 'Account created and health profile established.'
      });
    }

    res.json({
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, role: user.role, healthId: user.healthId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { role, passkey } = req.body;
    if (!role || !passkey) {
      return res.status(400).json({ error: 'Please provide role and passkey' });
    }

    const user = await User.findOne({ role, passkey });
    if (!user) return res.status(401).json({ error: 'Invalid credentials or user not found' });

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, role: user.role, healthId: user.healthId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/google', async (req, res) => {
  const { credential, role } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID_FALLBACK,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const assignedRole = role || 'patient';

    // Atomic upsert: find by email OR create new — guarantees same user doc always
    let user = await User.findOne({ email });

    if (!user) {
      const healthId = generateHealthId();
      try {
        user = await User.create({ name, role: assignedRole, passkey: 'GOOGLE_AUTH', healthId, email });
        if (assignedRole === 'patient') {
          await History.create({
            userId: user._id,
            title: 'Google Auth Registration',
            date: new Date().toISOString().split('T')[0],
            description: 'Account created via Google.'
          });
        }
      } catch (createErr) {
        // Handle race condition: if duplicate email error, fetch the existing one
        if (createErr.code === 11000) {
          user = await User.findOne({ email });
        } else {
          throw createErr;
        }
      }
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({
      message: 'Google login successful',
      token,
      user: { id: user._id, name: user.name, role: user.role, email: user.email, healthId: user.healthId }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed: ' + error.message });
  }
});

// ----------------------------------------------------
// PROFILE DATA API
// ----------------------------------------------------
app.get('/api/users/:id/profile', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const history = await History.find({ userId: user._id });
    res.json({
      user: { id: user._id, name: user.name, role: user.role, healthId: user.healthId },
      medicalHistory: history || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CONTACTS API
// ----------------------------------------------------
app.get('/api/users/:id/contacts', async (req, res) => {
  try {
    const rows = await Contact.find({ userId: req.params.id });
    res.json(rows.map(r => ({ ...r._doc, id: r._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:id/contacts', async (req, res) => {
  try {
    const { name, relation, phone, isSOS } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
    
    const contact = await Contact.create({ userId: req.params.id, name, relation, phone, isSOS });
    res.json({ ...contact._doc, id: contact._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// INTEGRATIONS API
// ----------------------------------------------------
// PRESCRIPTIONS
app.get('/api/users/:id/prescriptions', async (req, res) => {
  try {
    const rows = await Prescription.find({ userId: req.params.id });
    res.json(rows.map(r => ({ ...r._doc, id: r._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:id/prescriptions', async (req, res) => {
  try {
    const { doctorName, medication, dosage, instructions, date } = req.body;
    const prescription = await Prescription.create({ userId: req.params.id, doctorName, medication, dosage, instructions, date });
    res.json({ ...prescription._doc, id: prescription._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MOOD LOGS
app.get('/api/users/:id/moods', async (req, res) => {
  try {
    const rows = await Mood.find({ userId: req.params.id }).sort({ date: -1 });
    res.json(rows.map(r => ({ ...r._doc, id: r._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:id/moods', async (req, res) => {
  try {
    const { moodLevel, notes, date } = req.body;
    const mood = await Mood.create({ userId: req.params.id, moodLevel, notes, date });
    res.json({ ...mood._doc, id: mood._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLEARSCRIPT AI SCANNER (Powered by Gemini Vision)
app.post('/api/scan-prescription', async (req, res) => {
  try {
    const { rawText, image } = req.body;
    
    if (!image && !rawText) {
       return res.status(400).json({ error: "Image or text is required." });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash"
    });

    const prompt = `You are a medical OCR and data extraction AI. Extract ALL prescription details from the provided image or text.

IMPORTANT: Extract EVERY medication listed — prescriptions often contain 2-5 drugs. Do NOT stop at the first one.

Return ONLY a valid JSON object with this exact structure:
{
  "medications": [
    {
      "name": "Full medication name (String)",
      "dosage": "Dosage amount with unit (String, e.g. '500mg', '5ml')",
      "frequency": "How often to take (String, e.g. '1+0+1', '1-0-1', 'twice daily', 'once at night')",
      "duration": "How long to take (String, e.g. '7 days', '30 days', 'ongoing', or 'Not specified')",
      "instructions": "Special instructions (String, e.g. 'After meals', 'Before food', 'At bedtime', or 'None')",
      "confidence": Number from 0-100 for this specific medication
    }
  ],
  "doctorName": "Prescribing doctor's name (String, or 'Unknown' if not found)",
  "rawText": "The full raw text as read from the prescription (String)",
  "overallConfidence": Number from 0-100 representing overall scan quality,
  "warnings": ["Any warnings about illegible text, low confidence, or unclear dosages (Array of strings)"]
}

Rules:
- Extract ALL medications, not just the first one
- If a field is unclear, make your best guess and set confidence below 70
- rawText should be the complete text as you read it, preserving line breaks
- If handwriting is very messy, add a warning about legibility
- Never invent medications that aren't visible in the image/text`;

    let result;
    if (image) {
      const imagePart = {
        inlineData: {
          data: image,
          mimeType: "image/jpeg"
        }
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent([prompt, "Text: " + rawText]);
    }

    let responseText = result.response.text();
    // Robust JSON extraction: find the first { ... } block
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    } else {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    const data = JSON.parse(responseText);
    
    // Backward compatibility: ensure medications array exists
    if (!data.medications || !Array.isArray(data.medications)) {
      // Legacy single-med format fallback
      data.medications = [{
        name: data.medication || 'Unknown',
        dosage: data.dosage || '',
        frequency: 'Not specified',
        duration: 'Not specified',
        instructions: data.instructions || '',
        confidence: data.confidence || 50
      }];
      data.overallConfidence = data.confidence || 50;
      data.rawText = data.rawText || '';
      data.warnings = data.warnings || [];
      data.doctorName = data.doctorName || 'Unknown';
    }
    
    res.json(data);

  } catch (err) {
    console.error("Scanner Gemini Error:", err);
    res.status(500).json({ error: 'AI Pipeline Error: ' + err.message });
  }
});

// DRUG INTERACTIONS ENGINE (Powered by Gemini)
app.post('/api/check-interactions', async (req, res) => {
  try {
    const { medications, kidneyIssue, liverIssue } = req.body; 
    if (!medications || medications.length < 2) {
      return res.json({ pairs: [], drugRisks: {}, summary: 'Need at least 2 medications to check interactions.' });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.6-flash"
    });
    
    const contextParts = [];
    if (kidneyIssue) contextParts.push('The patient has kidney impairment — consider nephrotoxicity and reduced renal clearance.');
    if (liverIssue) contextParts.push('The patient has liver impairment — consider hepatotoxicity and reduced hepatic metabolism.');
    const contextStr = contextParts.length > 0 ? '\nPatient Context: ' + contextParts.join(' ') : '';

    const prompt = `You are an expert clinical pharmacologist AI. Analyze the following list of medications for pairwise drug interactions and prescription cascades.
    Medications: ${medications.join(', ')}${contextStr}
    
    Return ONLY a valid JSON object with this exact structure:
    {
      "pairs": [
        {
          "drugA": "Medication Name A",
          "drugB": "Medication Name B",
          "severity": "High" | "Moderate" | "Low",
          "message": "Clear clinical explanation of the interaction between these two drugs",
          "cascade": true | false
        }
      ],
      "drugRisks": {
        "Medication Name": "danger" | "caution" | "safe"
      },
      "summary": "Brief 1-2 sentence overall summary of findings"
    }
    
    Rules for pairs:
    - Only include pairs that have a REAL pharmacological interaction
    - severity "High" = contraindicated or life-threatening combination
    - severity "Moderate" = requires monitoring or dose adjustment
    - severity "Low" = minor interaction, usually clinically insignificant
    - cascade = true if one drug was prescribed to treat a side effect of another (prescription cascade)
    - If no interactions exist between any pair, return "pairs": []
    
    Rules for drugRisks:
    - "danger" = drug has HIGH RISK interactions with one or more other drugs in this list, or is contraindicated given patient context
    - "caution" = drug has moderate interactions or requires monitoring
    - "safe" = no significant interactions with other drugs in this list
    - Every medication in the input list MUST appear in drugRisks
    
    Rules for summary:
    - 1-2 sentences max
    - Mention number of interactions found and overall safety assessment`;
    
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    res.json(JSON.parse(responseText));
  } catch (err) {
    res.status(500).json({ error: 'Gemini AI Error: ' + err.message });
  }
});

// SYMPTOM CHECKER ENGINE (Powered by Gemini)
app.post('/api/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms, userId } = req.body;
    let medList = "None";
    
    if (userId && userId !== "dev-user-001" && userId !== "1") {
       try {
         const meds = await Prescription.find({ userId }).maxTimeMS(2000);
         medList = meds.length > 0 ? meds.map(m => m.medication).join(', ') : "None";
       } catch (e) {
         console.warn("Ignoring med fetch error:", e.message);
       }
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const prompt = `You are a clinical AI assistant.
Patient Symptoms: "${symptoms}". 
Current Active Medications: ${medList}. 
Check for any correlations between the symptoms and side effects of the medications. Be helpful but remind the user to consult a doctor. Keep it under 3 concise sentences.`;
    
    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TIMELINE AI ANALYSIS ENGINE
app.post('/api/timeline-analysis', async (req, res) => {
  try {
    const { medications, moods, patientContext } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const medList = (medications || []).map(m => `${m.medication}${m.dosage ? ' (' + m.dosage + ')' : ''}`);
    const moodSummary = (moods || []).map(m => `Level ${m.moodlevel}/5 on ${m.date || 'unknown date'}${m.notes ? ' — ' + m.notes : ''}`);

    const contextParts = [];
    if (patientContext?.kidneyIssue) contextParts.push('Patient has kidney impairment.');
    if (patientContext?.liverIssue) contextParts.push('Patient has liver impairment.');
    const contextStr = contextParts.length > 0 ? '\nPatient Context: ' + contextParts.join(' ') : '';

    const prompt = `You are a clinical health analysis AI. Analyze this patient's medication and mood data to find correlations and provide actionable insights.

Current Medications (${medList.length}):
${medList.length > 0 ? medList.map((m, i) => `${i + 1}. ${m}`).join('\n') : 'No active medications'}

Mood History (${moodSummary.length} entries):
${moodSummary.length > 0 ? moodSummary.slice(0, 20).join('\n') : 'No mood data available'}
${contextStr}

Return ONLY a valid JSON object:
{
  "title": "Short headline insight (max 8 words)",
  "summary": "1-2 sentence overview of key findings",
  "correlations": [
    {
      "drug": "Medication Name",
      "observation": "How this drug may be affecting mood/well-being",
      "moodChange": "positive" | "negative" | "neutral" | "unclear",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "stress": 45,
  "energy": 60,
  "recovery": 55,
  "recommendations": [
    "Specific actionable recommendation for the patient"
  ]
}

Rules:
- stress/energy/recovery must be integers 0-100
- Base mood trends on the actual mood levels and dates provided
- If mood levels are consistently 4-5, energy should be high and stress low
- If mood levels are declining over time, recovery should be lower
- If medications include known mood-affecting drugs (SSRIs, beta-blockers, corticosteroids, etc.), note the correlation
- correlations can be empty if medications don't have known mood effects
- recommendations should be 2-4 specific, actionable items
- If there's insufficient data, say so in the summary but still provide reasonable estimates`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    res.json(JSON.parse(responseText));
  } catch (err) {
    console.error('Timeline analysis error:', err);
    res.status(500).json({ error: 'Timeline analysis failed: ' + err.message });
  }
});

// Serve Frontend in Production
app.use(express.static(path.join(__dirname, '../dist')));
app.get(/^.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start Server (Only locally)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('Sanjeev AI Backend Server running on port', PORT);
  });
}

module.exports = app;
