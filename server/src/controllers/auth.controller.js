import bcrypt from 'bcryptjs';

import User from '../models/user.model.js';
import { cookieOptions, safeUser, sendToken } from '../utils/jwt.js';
import { ah, HttpError, text } from '../utils/http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// register user
export const registerUser = ah(async (req, res) => {
  const name = text(req.body.name, 80);
  const email = text(req.body.email, 120).toLowerCase();
  const phone = text(req.body.phone, 20);
  const { password } = req.body;

  if (!name || !email || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'All fields are required.');
  }
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters long.');

  if (await User.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password: await bcrypt.hash(password, 12),
    lastLoginAt: new Date(),
  });

  return sendToken({ user, statusCode: 201, res, message: 'Account created successfully.' });
});

// login user
export const loginUser = ah(async (req, res) => {
  const email = text(req.body.email, 120).toLowerCase();
  const { password } = req.body;

  if (!email || typeof password !== 'string' || !password) {
    throw new HttpError(400, 'Email and password are required.');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  if (!user.active) {
    throw new HttpError(403, 'This account has been disabled. Contact the store for help.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  return sendToken({ user, statusCode: 200, res, message: 'Logged in successfully.' });
});

// logout user
export const logoutUser = (req, res) => {
  res.clearCookie('token', cookieOptions());
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// get current user
export const getMe = (req, res) => res.status(200).json({ success: true, user: safeUser(req.user) });
