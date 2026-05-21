const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} = require('../controllers/record.controller');

router.use(protect);

router.get('/', getRecords);
router.post('/', authorize('admin', 'doctor'), createRecord);
router.get('/:id', getRecord);
router.put('/:id', authorize('admin', 'doctor'), updateRecord);
router.delete('/:id', authorize('admin'), deleteRecord);

module.exports = router;
