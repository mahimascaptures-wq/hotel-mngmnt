const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { upload, setUploadFolder } = require('../middleware/upload');
const {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
  addAttachments,
  removeAttachment,
} = require('../controllers/prescription.controller');

router.use(protect);

router.get('/', getPrescriptions);
router.post('/', authorize('admin', 'doctor'), createPrescription);
router.get('/:id', getPrescription);
router.put('/:id', authorize('admin', 'doctor'), updatePrescription);
router.delete('/:id', authorize('admin'), deletePrescription);

router.post(
  '/:id/attachments',
  authorize('admin', 'doctor'),
  setUploadFolder('prescriptions'),
  upload.array('files', 10),
  addAttachments
);
router.delete(
  '/:id/attachments/:attachmentId',
  authorize('admin', 'doctor'),
  removeAttachment
);

module.exports = router;
