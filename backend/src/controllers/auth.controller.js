const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Patient = require('../models/Patient');
const generateToken = require('../utils/generateToken');

// @desc    Register new user (defaults to patient role)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('Email already in use');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role && ['patient'].includes(role) ? role : 'patient',
  });

  if (user.role === 'patient') {
    await Patient.create({ user: user._id });
  }

  res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    token: generateToken(user._id, user.role),
  });
});

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const ok = await user.matchPassword(password);
  if (!ok) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
    token: generateToken(user._id, user.role),
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { register, login, me };
