// Customer account: profile, password, saved delivery addresses.
import bcrypt from 'bcryptjs';

import { KENYA_COUNTIES } from '../config/store.js';
import User from '../models/user.model.js';
import { ah, HttpError, normalizeKenyanPhone, text } from '../utils/http.js';
import { safeUser, sendToken } from '../utils/jwt.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const updateProfile = ah(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (req.body.name !== undefined) {
    const name = text(req.body.name, 80);
    if (!name) throw new HttpError(400, 'Name cannot be empty.');
    user.name = name;
  }

  if (req.body.email !== undefined) {
    const email = text(req.body.email, 120).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
    if (email !== user.email && (await User.exists({ email, _id: { $ne: user._id } }))) {
      throw new HttpError(409, 'Another account already uses this email.');
    }
    user.email = email;
  }

  if (req.body.phone !== undefined) {
    const raw = text(req.body.phone, 20);
    if (raw && !normalizeKenyanPhone(raw)) throw new HttpError(400, 'Enter a valid Kenyan phone number, e.g. 0712 345 678.');
    user.phone = raw;
  }

  await user.save();
  res.json({ success: true, message: 'Profile updated.', user: safeUser(user) });
});

// Changing the password signs out every other device (tokenVersion) and re-issues this one's cookie.
export const changePassword = ah(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    throw new HttpError(400, 'New password must be at least 8 characters long.');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, user.password))) {
    throw new HttpError(400, 'Your current password is incorrect.');
  }
  if (await bcrypt.compare(newPassword, user.password)) {
    throw new HttpError(400, 'Choose a password different from your current one.');
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return sendToken({ user, statusCode: 200, res, message: 'Password changed. Other devices have been signed out.' });
});

// ---------- addresses ----------
const addressFields = (body) => {
  const a = {
    label: text(body.label, 30) || 'Home',
    firstName: text(body.firstName, 60),
    lastName: text(body.lastName, 60),
    phone: text(body.phone, 20),
    street: text(body.street),
    apartment: text(body.apartment),
    city: text(body.city, 80),
    county: text(body.county, 40),
    postalCode: text(body.postalCode, 12),
    country: 'Kenya',
  };
  if (!a.firstName || !a.lastName || !a.phone || !a.street || !a.city || !a.county) {
    throw new HttpError(400, 'Please fill in name, phone, street, town and county.');
  }
  if (!normalizeKenyanPhone(a.phone)) throw new HttpError(400, 'Enter a valid Kenyan phone number, e.g. 0712 345 678.');
  if (!KENYA_COUNTIES.includes(a.county)) throw new HttpError(400, 'Please choose a county from the list.');
  return a;
};

const sendAddresses = (res, user, message) =>
  res.json({ success: true, message, addresses: user.addresses });

export const listAddresses = ah(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendAddresses(res, user);
});

export const addAddress = ah(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.addresses.length >= 10) throw new HttpError(400, 'You can save up to 10 addresses.');
  const makeDefault = Boolean(req.body.isDefault) || user.addresses.length === 0;
  if (makeDefault) user.addresses.forEach((a) => { a.isDefault = false; });
  user.addresses.push({ ...addressFields(req.body), isDefault: makeDefault });
  await user.save();
  sendAddresses(res.status(201), user, 'Address saved.');
});

export const updateAddress = ah(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new HttpError(404, 'Address not found.');
  Object.assign(address, addressFields(req.body));
  if (req.body.isDefault) {
    user.addresses.forEach((a) => { a.isDefault = a._id.equals(address._id); });
  }
  await user.save();
  sendAddresses(res, user, 'Address updated.');
});

export const setDefaultAddress = ah(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new HttpError(404, 'Address not found.');
  user.addresses.forEach((a) => { a.isDefault = a._id.equals(address._id); });
  await user.save();
  sendAddresses(res, user, 'Default address updated.');
});

export const deleteAddress = ah(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new HttpError(404, 'Address not found.');
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  sendAddresses(res, user, 'Address deleted.');
});
