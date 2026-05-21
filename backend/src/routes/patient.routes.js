const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} = require('../controllers/patient.controller');

router.use(protect);

router.get('/', authorize('admin', 'doctor', 'receptionist'), getPatients);
router.post('/', authorize('admin', 'receptionist'), createPatient);
router.get('/:id', getPatient);
router.put('/:id', authorize('admin', 'receptionist', 'patient'), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);

module.exports = router;
