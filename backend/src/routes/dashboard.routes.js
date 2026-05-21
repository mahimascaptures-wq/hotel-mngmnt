const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getStats } = require('../controllers/dashboard.controller');

router.use(protect);

router.get('/', authorize('admin', 'doctor', 'receptionist'), getStats);

module.exports = router;
