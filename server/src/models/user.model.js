import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    apartment: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    county: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'Kenya' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    phone: { type: String, trim: true, default: '' },

    password: { type: String, required: true, select: false },

    role: { type: String, enum: ['CUSTOMER', 'ADMIN'], default: 'CUSTOMER' },

    // Admins can block an account; blocked users cannot sign in.
    active: { type: Boolean, default: true },

    // Bumped when the password changes so older login cookies stop working.
    tokenVersion: { type: Number, default: 0 },

    addresses: { type: [addressSchema], default: [] },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

export default User;
