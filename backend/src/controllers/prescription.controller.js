const path = require('path');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { UPLOAD_ROOT } = require('../middleware/upload');

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

// @desc   Attach uploaded files to a prescription
// @route  POST /api/prescriptions/:id/attachments
// @access Doctor or Admin (doctor who owns it, or any admin)
const addAttachments = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  if (req.user.role === 'doctor') {
    const doc = await Doctor.findOne({ user: req.user._id });
    if (!doc || String(doc._id) !== String(prescription.doctor)) {
      res.status(403);
      throw new Error('You can only attach files to your own prescriptions');
    }
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files uploaded');
  }

  const newAttachments = req.files.map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    url: `/uploads/prescriptions/${f.filename}`,
    mimeType: f.mimetype,
    size: f.size,
  }));

  prescription.attachments.push(...newAttachments);
  await prescription.save();
  res.status(201).json(prescription.attachments);
});

// @desc   Remove an attachment from a prescription
// @route  DELETE /api/prescriptions/:id/attachments/:attachmentId
const removeAttachment = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);
  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  if (req.user.role === 'doctor') {
    const doc = await Doctor.findOne({ user: req.user._id });
    if (!doc || String(doc._id) !== String(prescription.doctor)) {
      res.status(403);
      throw new Error('Not allowed');
    }
  }

  const attachment = prescription.attachments.id(req.params.attachmentId);
  if (!attachment) {
    res.status(404);
    throw new Error('Attachment not found');
  }

  const filePath = path.join(UPLOAD_ROOT, 'prescriptions', attachment.filename);
  fs.promises.unlink(filePath).catch(() => {});

  prescription.attachments.pull({ _id: req.params.attachmentId });
  await prescription.save();
  res.json({ message: 'Attachment removed' });
});

module.exports = {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
  addAttachments,
  removeAttachment,
};
