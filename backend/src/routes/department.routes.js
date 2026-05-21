const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/department.controller');

router.use(protect);

router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

module.exports = router;
