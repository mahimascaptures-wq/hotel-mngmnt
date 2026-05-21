const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

const getDoctors = asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const filter = {};
  if (department) filter.department = department;
  let doctors = await Doctor.find(filter)
    .populate('user', 'name email phone avatar isActive')
    .populate('department', 'name');

  if (search) {
    const s = search.toLowerCase();
    doctors = doctors.filter(
      (d) =>
        d.user?.name?.toLowerCase().includes(s) ||
        d.user?.email?.toLowerCase().includes(s) ||
        d.specialization?.toLowerCase().includes(s)
    );
  }
  res.json(doctors);
});

const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('user', 'name email phone avatar isActive')
    .populate('department', 'name');
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  res.json(doctor);
});

const createDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    specialization,
    department,
    qualifications,
    experienceYears,
    consultationFee,
    bio,
    availableDays,
    availableFrom,
    availableTo,
  } = req.body;

  if (!name || !email || !specialization) {
    res.status(400);
    throw new Error('Name, email, and specialization are required');
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
    password: password || 'doctor123',
    role: 'doctor',
  });

  const doctor = await Doctor.create({
    user: user._id,
    specialization,
    department: department || undefined,
    qualifications,
    experienceYears,
    consultationFee,
    bio,
    availableDays,
    availableFrom,
    availableTo,
  });

  const populated = await Doctor.findById(doctor._id)
    .populate('user', 'name email phone avatar isActive')
    .populate('department', 'name');
  res.status(201).json(populated);
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const fields = [
    'specialization',
    'department',
    'qualifications',
    'experienceYears',
    'consultationFee',
    'bio',
    'availableDays',
    'availableFrom',
    'availableTo',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) doctor[f] = req.body[f];
  });
  await doctor.save();

  if (req.body.name || req.body.phone || req.body.email) {
    const user = await User.findById(doctor.user);
    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.phone) user.phone = req.body.phone;
      if (req.body.email) user.email = req.body.email;
      await user.save();
    }
  }

  const populated = await Doctor.findById(doctor._id)
    .populate('user', 'name email phone avatar isActive')
    .populate('department', 'name');
  res.json(populated);
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }
  await User.findByIdAndDelete(doctor.user);
  await doctor.deleteOne();
  res.json({ message: 'Doctor deleted' });
});

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
};
