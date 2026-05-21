const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, trim: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    qualifications: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    bio: { type: String },
    availableDays: {
      type: [String],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
    availableFrom: { type: String, default: '09:00' },
    availableTo: { type: String, default: '17:00' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
