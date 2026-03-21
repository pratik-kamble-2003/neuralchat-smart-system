const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = await User.create({ name, email, password });

    const tokenPayload = { id: user._id, role: user.role, tokenVersion: user.tokenVersion };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      accessToken,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshTokens +tokenVersion');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const tokenPayload = { id: user._id, role: user.role, tokenVersion: user.tokenVersion };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Limit stored refresh tokens to 5 (device sessions)
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens = user.refreshTokens.slice(-4);
    }
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, refreshToken);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Logged in successfully.',
      accessToken,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/refresh
 * @access  Public (uses cookie)
 */
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokens +tokenVersion');
    if (!user || !user.refreshTokens.includes(token)) {
      // Possible token theft — invalidate all sessions
      if (user) {
        user.refreshTokens = [];
        await user.save({ validateBeforeSave: false });
      }
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Refresh token reuse detected. Please log in again.' });
    }

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
    const tokenPayload = { id: user._id, role: user.role, tokenVersion: user.tokenVersion };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    setRefreshCookie(res, newRefreshToken);

    res.json({ success: true, accessToken: newAccessToken, user: user.getPublicProfile() });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const user = await User.findById(req.user._id).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
        await user.save({ validateBeforeSave: false });
      }
    }
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
const logoutAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshTokens +tokenVersion');
    user.refreshTokens = [];
    user.tokenVersion += 1; // Invalidate all access tokens
    await user.save({ validateBeforeSave: false });
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out from all devices.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user.getPublicProfile() });
};

module.exports = { register, login, refreshToken, logout, logoutAll, getMe };
