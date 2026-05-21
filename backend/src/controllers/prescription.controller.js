const asyncHandler = require('express-async-handler');
const Prescription = require('../models/Prescription');
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

const getPrescriptions = asyncHandler(async (req, res) => {
  const scope = await buildScopeFilter(req.user);
  const prescriptions = await Prescription.find(scope)
    .populate(populateOpts)
    .sort({ issuedDate: -1 });
  res.json(prescriptions);
});

const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id).populate(populateOpts);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }
  res.json(prescription);
});

const createPrescription = asyncHandler(async (req, res) => {
  const { patient, appointment, medications, advice } = req.body;
  let doctorId = req.body.doctor;

  if (req.user.role === 'doctor') {
    const doc = await Doctor.findOne({ user: req.user._id });
    if (!doc) {
      res.status(400);
      throw new Error('Doctor profile not found');
    }
    doctorId = doc._id;
  }

  if (!patient || !doctorId || !medications?.length) {
    res.status(400);
    throw new Error('Patient, doctor, and medications are required');
  }

  const prescription = await Prescription.create({
    patient,
    doctor: doctorId,
    appointment,
    medications,
    advice,
  });
  const populated = await prescription.populate(populateOpts);
  res.status(201).json(populated);
});

const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }
  ['medications', 'advice'].forEach((f) => {
    if (req.body[f] !== undefined) prescription[f] = req.body[f];
  });
  await prescription.save();
  const populated = await prescription.populate(populateOpts);
  res.json(populated);
});

const deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }
  await prescription.deleteOne();
  res.json({ message: 'Prescription deleted' });
});

module.exports = {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
};
