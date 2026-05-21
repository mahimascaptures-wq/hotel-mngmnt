const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctor.controller');

router.use(protect);

router.get('/', getDoctors);
router.post('/', authorize('admin'), createDoctor);
router.get('/:id', getDoctor);
router.put('/:id', authorize('admin', 'doctor'), updateDoctor);
router.delete('/:id', authorize('admin'), deleteDoctor);

module.exports = router;
