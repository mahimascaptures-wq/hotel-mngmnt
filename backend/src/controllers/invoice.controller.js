const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');

const populateOpts = [
  { path: 'patient', populate: { path: 'user', select: 'name email phone' } },
  { path: 'appointment', select: 'date timeSlot doctor' },
];

const generateInvoiceNumber = () => {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `INV-${ts}-${rand}`;
};

const computeTotals = (items, tax = 0, discount = 0) => {
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.amount) || Number(i.unitPrice) * Number(i.quantity || 1) || 0),
    0
  );
  const total = subtotal + Number(tax || 0) - Number(discount || 0);
  return { subtotal, total };
};

const buildScopeFilter = async (user) => {
  if (user.role === 'admin' || user.role === 'receptionist') return {};
  if (user.role === 'patient') {
    const pat = await Patient.findOne({ user: user._id });
    return pat ? { patient: pat._id } : { _id: null };
  }
  return { _id: null };
};

const getInvoices = asyncHandler(async (req, res) => {
  const scope = await buildScopeFilter(req.user);
  const invoices = await Invoice.find(scope).populate(populateOpts).sort('-createdAt');
  res.json(invoices);
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate(populateOpts);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  res.json(invoice);
});

const createInvoice = asyncHandler(async (req, res) => {
  const { patient, appointment, items = [], tax = 0, discount = 0, paymentMethod, notes } = req.body;
  if (!patient || !items.length) {
    res.status(400);
    throw new Error('Patient and at least one item are required');
  }
  const normalizedItems = items.map((i) => ({
    description: i.description,
    quantity: Number(i.quantity || 1),
    unitPrice: Number(i.unitPrice),
    amount: Number(i.amount ?? Number(i.unitPrice) * Number(i.quantity || 1)),
  }));
  const { subtotal, total } = computeTotals(normalizedItems, tax, discount);
  const invoice = await Invoice.create({
    invoiceNumber: generateInvoiceNumber(),
    patient,
    appointment,
    items: normalizedItems,
    subtotal,
    tax,
    discount,
    total,
    paymentMethod,
    notes,
  });
  const populated = await invoice.populate(populateOpts);
  res.status(201).json(populated);
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  if (req.body.items) {
    invoice.items = req.body.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity || 1),
      unitPrice: Number(i.unitPrice),
      amount: Number(i.amount ?? Number(i.unitPrice) * Number(i.quantity || 1)),
    }));
  }
  if (req.body.tax !== undefined) invoice.tax = req.body.tax;
  if (req.body.discount !== undefined) invoice.discount = req.body.discount;
  if (req.body.status !== undefined) {
    invoice.status = req.body.status;
    if (req.body.status === 'paid') invoice.paidAt = new Date();
  }
  if (req.body.paymentMethod !== undefined) invoice.paymentMethod = req.body.paymentMethod;
  if (req.body.notes !== undefined) invoice.notes = req.body.notes;

  const { subtotal, total } = computeTotals(invoice.items, invoice.tax, invoice.discount);
  invoice.subtotal = subtotal;
  invoice.total = total;

  await invoice.save();
  const populated = await invoice.populate(populateOpts);
  res.json(populated);
});

const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  await invoice.deleteOne();
  res.json({ message: 'Invoice deleted' });
});

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
