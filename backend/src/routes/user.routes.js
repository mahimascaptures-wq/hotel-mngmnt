const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');

router.use(protect);

router.get('/', authorize('admin', 'receptionist'), getUsers);
router.post('/', authorize('admin'), createUser);
router.get('/:id', getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
