import { Router } from 'express';

import {
  addAddress,
  changePassword,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
  updateProfile,
} from '../controllers/account.controller.js';
import { getMe, loginUser, logoutUser, registerUser } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { rateLimit } from '../middlewares/rateLimit.middleware.js';

const authRouter = Router();

// public routes (rate-limited against password guessing)
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts. Please wait 15 minutes and try again.' });
authRouter.post('/register', authLimit, registerUser);
authRouter.post('/login', authLimit, loginUser);
authRouter.post('/logout', logoutUser);

// account (signed-in customers)
authRouter.get('/me', protect, getMe);
authRouter.patch('/me', protect, updateProfile);
authRouter.patch('/me/password', protect, authLimit, changePassword);

authRouter.get('/me/addresses', protect, listAddresses);
authRouter.post('/me/addresses', protect, addAddress);
authRouter.patch('/me/addresses/:addressId', protect, updateAddress);
authRouter.post('/me/addresses/:addressId/default', protect, setDefaultAddress);
authRouter.delete('/me/addresses/:addressId', protect, deleteAddress);

export default authRouter;
