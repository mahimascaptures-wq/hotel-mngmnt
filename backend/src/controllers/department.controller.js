const asyncHandler = require('express-async-handler');
const Department = require('../models/Department');

const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate({
    path: 'head',
    populate: { path: 'user', select: 'name email' },
  });
  res.json(departments);
});

const getDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate({
    path: 'head',
    populate: { path: 'user', select: 'name email' },
  });
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }
  res.json(department);
});

const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, head, location } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Name is required');
  }
  const department = await Department.create({ name, description, head, location });
  res.status(201).json(department);
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }
  ['name', 'description', 'head', 'location'].forEach((f) => {
    if (req.body[f] !== undefined) department[f] = req.body[f];
  });
  await department.save();
  res.json(department);
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error('Department not found');
  }
  await department.deleteOne();
  res.json({ message: 'Department deleted' });
});

module.exports = {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
