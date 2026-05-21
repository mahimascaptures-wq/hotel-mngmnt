const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');

const getStats = asyncHandler(async (req, res) => {
  const [patients, doctors, departments, appointmentsToday, totalAppointments] = await Promise.all([
    Patient.countDocuments(),
    Doctor.countDocuments(),
    Department.countDocuments(),
    Appointment.countDocuments({
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    Appointment.countDocuments(),
  ]);

  const revenueAgg = await Invoice.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  const apptStatusAgg = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const appointmentsByStatus = apptStatusAgg.reduce(
    (acc, x) => ({ ...acc, [x._id]: x.count }),
    {}
  );

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({ label: d.toLocaleString('en', { month: 'short' }), start: d, end: next });
  }
  const apptTrend = await Promise.all(
    months.map(async (m) => ({
      month: m.label,
      count: await Appointment.countDocuments({ date: { $gte: m.start, $lt: m.end } }),
    }))
  );
  const revenueTrend = await Promise.all(
    months.map(async (m) => {
      const agg = await Invoice.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: m.start, $lt: m.end } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]);
      return { month: m.label, total: agg[0]?.total || 0 };
    })
  );

  const recentAppointments = await Appointment.find()
    .populate({ path: 'patient', populate: { path: 'user', select: 'name' } })
    .populate({ path: 'doctor', populate: { path: 'user', select: 'name' } })
    .sort('-createdAt')
    .limit(5);

  res.json({
    counts: {
      patients,
      doctors,
      departments,
      appointmentsToday,
      totalAppointments,
      revenue,
    },
    appointmentsByStatus,
    apptTrend,
    revenueTrend,
    recentAppointments,
  });
});

module.exports = { getStats };
