const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Patient = require('../models/Patient');

// @desc    List all patients (admin/doctor/receptionist)
const getPatients = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let userFilter = { role: 'patient' };
  if (search) {
    userFilter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  const users = await User.find(userFilter).select('_id name email phone avatar createdAt');
  const userIds = users.map((u) => u._id);
  const patients = await Patient.find({ user: { $in: userIds } }).populate(
    'user',
    'name email phone avatar createdAt'
  );
  res.json(patients);
});

const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(
    'user',
    'name email phone avatar isActive createdAt'
  );
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  res.json(patient);
});

// @desc    Create patient (staff creates user + patient)
const createPatient = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    allergies,
    chronicConditions,
  } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error('Name and email are required');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('Email already in use');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password: password || 'patient123',
    role: 'patient',
  });

  const patient = await Patient.create({
    user: user._id,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    allergies,
    chronicConditions,
  });

  const populated = await patient.populate(
    'user',
    'name email phone avatar createdAt'
  );
  res.status(201).json(populated);
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  const fields = [
    'dateOfBirth',
    'gender',
    'bloodGroup',
    'address',
    'emergencyContact',
    'allergies',
    'chronicConditions',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) patient[f] = req.body[f];
  });
  await patient.save();

  if (req.body.name || req.body.phone || req.body.email) {
    const user = await User.findById(patient.user);
    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.phone) user.phone = req.body.phone;
      if (req.body.email) user.email = req.body.email;
      await user.save();
    }
  }

  const populated = await patient.populate(
    'user',
    'name email phone avatar createdAt'
  );
  res.json(populated);
});

const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  await User.findByIdAndDelete(patient.user);
  await patient.deleteOne();
  res.json({ message: 'Patient deleted' });
});

module.exports = {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
};
