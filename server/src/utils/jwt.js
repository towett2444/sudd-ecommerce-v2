import jwt from 'jsonwebtoken';

// sign token (includes the account's tokenVersion so a password change signs out other devices)
export const signToken = (user) => {
  return jwt.sign({ id: user._id, v: user.tokenVersion || 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
};

export const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
});

// send token
export const sendToken = ({ user, statusCode, res, message }) => {
  const token = signToken(user);

  res.cookie('token', token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });

  return res.status(statusCode).json({
    success: true,
    message,
    user: safeUser(user),
  });
};
