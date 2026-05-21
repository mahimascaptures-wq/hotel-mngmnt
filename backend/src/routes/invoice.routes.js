const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} = require('../controllers/invoice.controller');

router.use(protect);

router.get('/', getInvoices);
router.post('/', authorize('admin', 'receptionist'), createInvoice);
router.get('/:id', getInvoice);
router.put('/:id', authorize('admin', 'receptionist'), updateInvoice);
router.delete('/:id', authorize('admin'), deleteInvoice);

module.exports = router;
