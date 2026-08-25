const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sanjeev-ai';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- User Schema ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, sparse: true, unique: true }, // Unique index ensures same Google email always maps to same user
  role: { type: String, enum: ['patient', 'caregiver', 'pharmacist', 'doctor'], default: 'patient' },
  passkey: { type: String, required: true },
  healthId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// --- Prescription Schema ---
const prescriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medication: { type: String, required: true },
  dosage: String,
  instructions: String,
  date: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

// --- Mood Schema ---
const moodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moodLevel: { type: Number, required: true, min: 1, max: 5 },
  notes: String,
  date: { type: String, default: () => new Date().toISOString() }
});

// --- Medical History Schema ---
const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  date: String,
  description: String
});

// --- Contacts Schema ---
const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  relation: String,
  phone: String,
  isSOS: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);
const Prescription = mongoose.model('Prescription', prescriptionSchema);
const Mood = mongoose.model('Mood', moodSchema);
const History = mongoose.model('History', historySchema);
const Contact = mongoose.model('Contact', contactSchema);

module.exports = {
  User,
  Prescription,
  Mood,
  History,
  Contact
};
