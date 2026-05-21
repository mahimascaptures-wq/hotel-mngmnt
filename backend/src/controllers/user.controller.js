const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Patient = require('../models/Patient');

const ALLOWED_ROLES = ['admin', 'doctor', 'receptionist', 'patient'];

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('name, email, password, and role are required');
  }
  if (!ALLOWED_ROLES.includes(role)) {
    res.status(400);
    throw new Error(`Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}`);
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('Email already in use');
  }

  const user = await User.create({ name, email, password, phone, role });

  if (role === 'patient') {
    await Patient.create({ user: user._id });
  }

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  const users = await User.find(filter).sort('-createdAt');
  res.json(users);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.name = req.body.name ?? user.name;
  user.phone = req.body.phone ?? user.phone;
  user.role = req.body.role ?? user.role;
  user.isActive = req.body.isActive ?? user.isActive;
  if (req.body.password) user.password = req.body.password;

  const updated = await user.save();
  res.json(updated);
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

module.exports = { createUser, getUsers, getUser, updateUser, deleteUser };
