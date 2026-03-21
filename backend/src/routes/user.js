const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

router.use(protect);

// GET /api/users/me - already handled in /api/auth/me but also here
router.get('/profile', (req, res) => {
  res.json({ success: true, user: req.user.getPublicProfile() });
});

// PATCH /api/users/profile - Update name/avatar
router.patch(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 chars').escape(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const allowedFields = ['name'];
      const updates = {};
      allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
      res.json({ success: true, user: user.getPublicProfile() });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/users/password - Change password
router.patch(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and a number'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: errors.array()[0].msg });
      }

      const user = await User.findById(req.user._id).select('+password +tokenVersion');
      const isMatch = await user.comparePassword(req.body.currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      user.password = req.body.newPassword;
      user.tokenVersion += 1; // Invalidate all existing sessions
      user.refreshTokens = [];
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
      res.json({ success: true, message: 'Password updated. Please log in again.' });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/users/account - Delete own account
router.delete('/account', async (req, res, next) => {
  try {
    const Chat = require('../models/Chat');
    await Promise.all([
      User.findByIdAndDelete(req.user._id),
      Chat.deleteMany({ userId: req.user._id }),
    ]);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ success: true, message: 'Account deleted.' });
  } catch (error) {
    next(error);
  }
});

// ── Admin routes ─────────────────────────────────────────────────────────
router.get('/admin/users', authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const users = await User.find({})
      .select('-password -refreshTokens')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await User.countDocuments();
    res.json({ success: true, users, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
