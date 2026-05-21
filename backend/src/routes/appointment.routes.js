const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} = require('../controllers/appointment.controller');

router.use(protect);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.get('/:id', getAppointment);
router.put('/:id', authorize('admin', 'receptionist', 'doctor'), updateAppointment);
router.delete('/:id', authorize('admin', 'receptionist'), deleteAppointment);

module.exports = router;
