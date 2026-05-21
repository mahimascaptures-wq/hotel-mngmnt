const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const populateOpts = [
  { path: 'patient', populate: { path: 'user', select: 'name email phone' } },
  { path: 'doctor', populate: [{ path: 'user', select: 'name email' }, { path: 'department', select: 'name' }] },
  { path: 'department', select: 'name' },
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

const getAppointments = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const scope = await buildScopeFilter(req.user);
  const filter = { ...scope };
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const appointments = await Appointment.find(filter)
    .populate(populateOpts)
    .sort({ date: -1 });
  res.json(appointments);
});

const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(populateOpts);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  res.json(appointment);
});

const createAppointment = asyncHandler(async (req, res) => {
  const { patient, doctor, department, date, timeSlot, reason, fee } = req.body;
  if (!doctor || !date || !timeSlot) {
    res.status(400);
    throw new Error('Doctor, date, and timeSlot are required');
  }

  let patientId = patient;
  if (req.user.role === 'patient') {
    const me = await Patient.findOne({ user: req.user._id });
    if (!me) {
      res.status(400);
      throw new Error('Patient profile not found');
    }
    patientId = me._id;
  }
  if (!patientId) {
    res.status(400);
    throw new Error('Patient is required');
  }

  const doc = await Doctor.findById(doctor);
  const appointment = await Appointment.create({
    patient: patientId,
    doctor,
    department: department || doc?.department,
    date,
    timeSlot,
    reason,
    fee: fee ?? doc?.consultationFee ?? 0,
  });
  const populated = await appointment.populate(populateOpts);
  res.status(201).json(populated);
});

const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  ['date', 'timeSlot', 'reason', 'notes', 'status', 'fee', 'doctor', 'department'].forEach((f) => {
    if (req.body[f] !== undefined) appointment[f] = req.body[f];
  });
  await appointment.save();
  const populated = await appointment.populate(populateOpts);
  res.json(populated);
});

const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  await appointment.deleteOne();
  res.json({ message: 'Appointment deleted' });
});

module.exports = {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
