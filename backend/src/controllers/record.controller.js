const asyncHandler = require('express-async-handler');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const populateOpts = [
  { path: 'patient', populate: { path: 'user', select: 'name email phone' } },
  { path: 'doctor', populate: { path: 'user', select: 'name email' } },
  { path: 'appointment', select: 'date timeSlot' },
];

const buildScopeFilter = async (user) => {
  if (user.role === 'admin' || user.role === 'receptionist') return {};
  if (user.role === 'doctor') {
    const doc = await Doctor.findOne({ user: user._id });
    return doc ? { doctor: doc._id } : { _id: null };
  }
  if (user.role === 'patient') {
    const pat = await Patient.findOne({ user: user._id });
    return pat ? { patient: pat._id } : { _id: null };
  }
  return { _id: null };
};

const getRecords = asyncHandler(async (req, res) => {
  const scope = await buildScopeFilter(req.user);
  const records = await MedicalRecord.find(scope)
    .populate(populateOpts)
    .sort({ visitDate: -1 });
  res.json(records);
});

const getRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id).populate(populateOpts);
  if (!record) {
    res.status(404);
    throw new Error('Record not found');
  }
  res.json(record);
});

const createRecord = asyncHandler(async (req, res) => {
  const { patient, appointment, diagnosis, symptoms, treatment, notes, vitals, attachments, visitDate } = req.body;
  let doctorId = req.body.doctor;

  if (req.user.role === 'doctor') {
    const doc = await Doctor.findOne({ user: req.user._id });
    if (!doc) {
      res.status(400);
      throw new Error('Doctor profile not found');
    }
    doctorId = doc._id;
  }

  if (!patient || !doctorId || !diagnosis) {
    res.status(400);
    throw new Error('Patient, doctor, and diagnosis are required');
  }

  const record = await MedicalRecord.create({
    patient,
    doctor: doctorId,
    appointment,
    diagnosis,
    symptoms,
    treatment,
    notes,
    vitals,
    attachments,
    visitDate,
  });
  const populated = await record.populate(populateOpts);
  res.status(201).json(populated);
});

const updateRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Record not found');
  }
  ['diagnosis', 'symptoms', 'treatment', 'notes', 'vitals', 'attachments', 'visitDate'].forEach((f) => {
    if (req.body[f] !== undefined) record[f] = req.body[f];
  });
  await record.save();
  const populated = await record.populate(populateOpts);
  res.json(populated);
});

const deleteRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error('Record not found');
  }
  await record.deleteOne();
  res.json({ message: 'Record deleted' });
});

module.exports = {
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
};
