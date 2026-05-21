const mongoose = require('mongoose');

const STATUS = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    reason: { type: String, trim: true },
    notes: { type: String },
    status: { type: String, enum: STATUS, default: 'scheduled' },
    fee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

appointmentSchema.statics.STATUS = STATUS;

module.exports = mongoose.model('Appointment', appointmentSchema);
