require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Patient = require('../models/Patient');

const EMAIL = process.argv[2] || 'admin@hospital.com';
const PASSWORD = process.argv[3] || 'admin123';
const ROLE = process.argv[4] || 'admin';
const NAME =
  process.argv[5] ||
  (ROLE === 'admin'
    ? 'Admin User'
    : ROLE === 'receptionist'
      ? 'Reception Staff'
      : ROLE === 'doctor'
        ? 'Doctor User'
        : 'New User');

(async () => {
  await connectDB();
  let user = await User.findOne({ email: EMAIL });

  if (user) {
    user.password = PASSWORD;
    user.role = ROLE;
    user.isActive = true;
    user.name = user.name || NAME;
    await user.save();
    console.log(`\n[OK] Existing user reset:`);
  } else {
    user = await User.create({
      name: NAME,
      email: EMAIL,
      password: PASSWORD,
      role: ROLE,
      isActive: true,
    });
    if (ROLE === 'patient') {
      await Patient.create({ user: user._id });
    }
    console.log(`\n[OK] New user created:`);
  }

  console.log(`  Name    : ${user.name}`);
  console.log(`  Email   : ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Role    : ${ROLE}\n`);

  await mongoose.connection.close();
  process.exit(0);
})().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
