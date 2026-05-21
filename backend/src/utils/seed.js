require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');

const run = async () => {
  await connectDB();
  console.log('Wiping existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Department.deleteMany({}),
    Appointment.deleteMany({}),
    Invoice.deleteMany({}),
  ]);

  console.log('Seeding departments...');
  const departments = await Department.create([
    { name: 'Cardiology', description: 'Heart & vascular care', location: 'Block A, Floor 2' },
    { name: 'Neurology', description: 'Brain & nervous system', location: 'Block B, Floor 3' },
    { name: 'Orthopedics', description: 'Bones, joints & muscles', location: 'Block C, Floor 1' },
    { name: 'Pediatrics', description: 'Care for children', location: 'Block A, Floor 1' },
    { name: 'General Medicine', description: 'Primary care', location: 'Block D, Floor 1' },
  ]);

  console.log('Seeding admin & staff users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@hospital.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1 555 0000',
  });

  const receptionist = await User.create({
    name: 'Riya Receptionist',
    email: 'reception@hospital.com',
    password: 'reception123',
    role: 'receptionist',
    phone: '+1 555 0001',
  });

  console.log('Seeding doctors...');
  const doctorSeeds = [
    {
      user: { name: 'Dr. Aisha Khan', email: 'aisha@hospital.com', phone: '+1 555 1001' },
      specialization: 'Cardiologist',
      department: departments[0]._id,
      qualifications: ['MBBS', 'MD - Cardiology'],
      experienceYears: 12,
      consultationFee: 80,
      bio: 'Senior cardiologist with extensive experience in interventional cardiology.',
    },
    {
      user: { name: 'Dr. Rohan Mehta', email: 'rohan@hospital.com', phone: '+1 555 1002' },
      specialization: 'Neurologist',
      department: departments[1]._id,
      qualifications: ['MBBS', 'DM - Neurology'],
      experienceYears: 9,
      consultationFee: 90,
    },
    {
      user: { name: 'Dr. Sara Lee', email: 'sara@hospital.com', phone: '+1 555 1003' },
      specialization: 'Orthopedic Surgeon',
      department: departments[2]._id,
      qualifications: ['MBBS', 'MS - Ortho'],
      experienceYears: 7,
      consultationFee: 75,
    },
    {
      user: { name: 'Dr. Imran Ali', email: 'imran@hospital.com', phone: '+1 555 1004' },
      specialization: 'Pediatrician',
      department: departments[3]._id,
      qualifications: ['MBBS', 'MD - Pediatrics'],
      experienceYears: 10,
      consultationFee: 60,
    },
    {
      user: { name: 'Dr. Neha Sharma', email: 'neha@hospital.com', phone: '+1 555 1005' },
      specialization: 'General Physician',
      department: departments[4]._id,
      qualifications: ['MBBS'],
      experienceYears: 5,
      consultationFee: 40,
    },
  ];

  const doctors = [];
  for (const seed of doctorSeeds) {
    const u = await User.create({
      ...seed.user,
      password: 'doctor123',
      role: 'doctor',
    });
    const d = await Doctor.create({
      user: u._id,
      specialization: seed.specialization,
      department: seed.department,
      qualifications: seed.qualifications,
      experienceYears: seed.experienceYears,
      consultationFee: seed.consultationFee,
      bio: seed.bio,
    });
    doctors.push(d);
  }

  await Department.findByIdAndUpdate(departments[0]._id, { head: doctors[0]._id });
  await Department.findByIdAndUpdate(departments[1]._id, { head: doctors[1]._id });
  await Department.findByIdAndUpdate(departments[2]._id, { head: doctors[2]._id });
  await Department.findByIdAndUpdate(departments[3]._id, { head: doctors[3]._id });
  await Department.findByIdAndUpdate(departments[4]._id, { head: doctors[4]._id });

  console.log('Seeding patients...');
  const patientSeeds = [
    {
      name: 'John Carter',
      email: 'john@example.com',
      phone: '+1 555 2001',
      dob: '1985-04-12',
      gender: 'male',
      bloodGroup: 'O+',
    },
    {
      name: 'Emily Stone',
      email: 'emily@example.com',
      phone: '+1 555 2002',
      dob: '1992-09-23',
      gender: 'female',
      bloodGroup: 'A+',
    },
    {
      name: 'Michael Tan',
      email: 'michael@example.com',
      phone: '+1 555 2003',
      dob: '1978-01-30',
      gender: 'male',
      bloodGroup: 'B-',
    },
    {
      name: 'Priya Patel',
      email: 'priya@example.com',
      phone: '+1 555 2004',
      dob: '2001-07-15',
      gender: 'female',
      bloodGroup: 'AB+',
    },
    {
      name: 'David Kim',
      email: 'david@example.com',
      phone: '+1 555 2005',
      dob: '1965-11-02',
      gender: 'male',
      bloodGroup: 'O-',
    },
  ];

  const patients = [];
  for (const s of patientSeeds) {
    const u = await User.create({
      name: s.name,
      email: s.email,
      phone: s.phone,
      password: 'patient123',
      role: 'patient',
    });
    const p = await Patient.create({
      user: u._id,
      dateOfBirth: new Date(s.dob),
      gender: s.gender,
      bloodGroup: s.bloodGroup,
      address: '123 Main Street',
    });
    patients.push(p);
  }

  console.log('Seeding appointments...');
  const STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled'];
  const SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  const appointments = [];
  for (let i = 0; i < 20; i++) {
    const p = patients[i % patients.length];
    const d = doctors[i % doctors.length];
    const offset = Math.floor(Math.random() * 30) - 15;
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const a = await Appointment.create({
      patient: p._id,
      doctor: d._id,
      department: d.department,
      date,
      timeSlot: SLOTS[i % SLOTS.length],
      reason: 'Routine consultation',
      status: STATUSES[i % STATUSES.length],
      fee: d.consultationFee,
    });
    appointments.push(a);
  }

  console.log('Seeding invoices...');
  for (let i = 0; i < 10; i++) {
    const a = appointments[i];
    const items = [
      {
        description: 'Consultation Fee',
        quantity: 1,
        unitPrice: a.fee,
        amount: a.fee,
      },
      {
        description: 'Lab Tests',
        quantity: 1,
        unitPrice: 25,
        amount: 25,
      },
    ];
    const subtotal = items.reduce((s, x) => s + x.amount, 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;
    await Invoice.create({
      invoiceNumber: `INV-SEED-${1000 + i}`,
      patient: a.patient,
      appointment: a._id,
      items,
      subtotal,
      tax,
      total,
      status: i % 2 === 0 ? 'paid' : 'unpaid',
      paymentMethod: i % 2 === 0 ? 'card' : 'cash',
      paidAt: i % 2 === 0 ? new Date() : undefined,
    });
  }

  console.log('\nSeeding complete! Demo accounts:');
  console.log('  Admin       -> admin@hospital.com / admin123');
  console.log('  Receptionist-> reception@hospital.com / reception123');
  console.log('  Doctor      -> aisha@hospital.com / doctor123');
  console.log('  Patient     -> john@example.com / patient123');

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
