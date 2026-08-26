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

// CLEARSCRIPT AI SCANNER (Powered by new Python Pipeline)
app.post('/api/scan-prescription', async (req, res) => {
  try {
    const { rawText, image } = req.body;
    
    // We expect the new Python service URL from env, default to local if not set
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // If no image is provided, we can't run OCR.
    if (!image) {
       return res.status(400).json({ error: "Image is required for PaddleOCR pipeline." });
    }

    // Convert the base64 string from frontend back to a Blob/Buffer
    const imageBuffer = Buffer.from(image, 'base64');
    
    // Create FormData for the FastAPI endpoint
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'prescription.jpg');

    // Send to the Python Microservice
    const response = await fetch(`${aiServiceUrl}/api/prescriptions/scan`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Service Error: ${response.status} ${errText}`);
    }

    const aiData = await response.json();
    
    // The Python API returns an array of medications. The frontend clearscript.js
    // currently expects a single flat object. Let's map the strongest confidence
    // medication to the old frontend format for seamless backward compatibility!
    
    let bestMed = {
      medication: "Unknown (No Meds Found)",
      dosage: "",
      instructions: "",
      confidence: 0,
      doctorName: "Extracted via OCR"
    };

    if (aiData.medications && aiData.medications.length > 0) {
      // Sort by highest overall confidence
      aiData.medications.sort((a, b) => b.overall_confidence - a.overall_confidence);
      const top = aiData.medications[0];
      
      bestMed = {
        medication: top.candidate_name,
        dosage: top.dosage || "",
        instructions: (top.frequency || "") + " " + (top.instructions || ""),
        confidence: Math.round(top.overall_confidence),
        doctorName: "PaddleOCR Pipeline"
      };
    }

    res.json(bestMed);

  } catch (err) {
    console.error("Scanner Proxy Error:", err);
    res.status(500).json({ error: 'AI Pipeline Error: ' + err.message });
  }
});

// DRUG INTERACTIONS ENGINE (Powered by Gemini)
app.post('/api/check-interactions', async (req, res) => {
  try {
    const { medications } = req.body; 
    if (!medications || medications.length < 2) {
      return res.json({ hasInteraction: false });
    }

    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });
    
    const prompt = `You are an expert clinical pharmacologist AI. Analyze the following list of medications for potential interactions and "prescription cascades".
    Medications: ${medications.join(', ')}
    Return ONLY a valid JSON object:
    { "hasInteraction": true, "cascade": true, "severity": "High", "message": "explanation" }
    If none, { "hasInteraction": false }`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON: " + responseText);
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    res.status(500).json({ error: 'Gemini AI Error: ' + err.message });
  }
});

// SYMPTOM CHECKER ENGINE (Powered by Gemini)
app.post('/api/analyze-symptoms', async (req, res) => {
  try {
    const { symptoms, userId } = req.body;
    const meds = await Prescription.find({ userId });
    const medList = meds.length > 0 ? meds.map(m => m.medication).join(', ') : "None";
    
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });
    const prompt = `Patient Symptoms: "${symptoms}". Medications: ${medList}. Check for correlations. Max 3 sentences.`;
    
    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
