const router = require('express').Router();
const {
  getChats,
  getChat,
  createChat,
  sendMessage,
  renameChat,
  togglePin,
  deleteChat,
  deleteAllChats,
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const { messageValidator, titleValidator, chatIdValidator, validate } = require('../middleware/validate');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getChats)
  .post(createChat)
  .delete(deleteAllChats);

router.route('/:chatId')
  .get(chatIdValidator, validate, getChat)
  .delete(chatIdValidator, validate, deleteChat);

router.post('/:chatId/messages', chatLimiter, chatIdValidator, messageValidator, validate, sendMessage);
router.patch('/:chatId/title', chatIdValidator, titleValidator, validate, renameChat);
router.patch('/:chatId/pin', chatIdValidator, validate, togglePin);

module.exports = router;
