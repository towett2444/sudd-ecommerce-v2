import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const unauthorized = (res, message) => res.status(401).json({ success: false, message });

// protect authenticated routes
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) return unauthorized(res, 'Please log in to continue.');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) return unauthorized(res, 'User no longer exists.');

    if (!user.active) return unauthorized(res, 'This account has been disabled. Contact the store for help.');

    // Password changed since this login
    if ((decoded.v || 0) !== (user.tokenVersion || 0)) {
      return unauthorized(res, 'Your session has ended. Please log in again.');
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorized(res, 'Your session has expired. Please log in again.');
    }

    if (error.name === 'JsonWebTokenError') {
      return unauthorized(res, 'Invalid authentication token.');
    }

    console.error('Protect middleware error:', error);

    return unauthorized(res, 'Authentication failed.');
  }
};

// restrict routes by role
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to perform this action.',
      });
    }

    next();
  };
};

export const adminOnly = [protect, restrictTo('ADMIN')];
