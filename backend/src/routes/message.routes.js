const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  getConversations,
  getMessagesWith,
  sendMessage,
  getUnreadCount,
  getContacts,
} = require('../controllers/message.controller');

router.use(protect);

router.get('/conversations', getConversations);
router.get('/contacts', getContacts);
router.get('/unread-count', getUnreadCount);
router.get('/with/:userId', getMessagesWith);
router.post('/', sendMessage);

module.exports = router;
