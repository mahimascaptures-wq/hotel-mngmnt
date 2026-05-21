const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
} = require('../controllers/prescription.controller');

router.use(protect);

router.get('/', getPrescriptions);
router.post('/', authorize('admin', 'doctor'), createPrescription);
router.get('/:id', getPrescription);
router.put('/:id', authorize('admin', 'doctor'), updatePrescription);
router.delete('/:id', authorize('admin'), deletePrescription);

module.exports = router;
