import mongoose from 'mongoose';

export const ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];
export const PAYMENT_METHODS = ['MPESA', 'CARD', 'COD'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null },
    size: { type: String, default: null },
    color: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const addressFields = {
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, default: '' },
  phone: { type: String, required: true, trim: true },
  street: { type: String, required: true, trim: true },
  apartment: { type: String, default: '', trim: true },
  city: { type: String, required: true, trim: true },
  county: { type: String, required: true, trim: true },
  postalCode: { type: String, default: '', trim: true },
  country: { type: String, required: true, default: 'Kenya', trim: true },
};

const shippingAddressSchema = new mongoose.Schema(
  { ...addressFields, email: { type: String, required: true, lowercase: true, trim: true } },
  { _id: false },
);

// Billing details. When sameAsShipping is true the other fields are copied from the delivery address.
const billingSchema = new mongoose.Schema(
  {
    sameAsShipping: { type: Boolean, default: true },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    street: { type: String, trim: true, default: '' },
    apartment: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    county: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'Kenya' },
    companyName: { type: String, default: '', trim: true },
    kraPin: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    provider: { type: String, default: '' }, // mpesa | paystack | demo | cash
    phone: { type: String, default: '' }, // M-Pesa number charged
    checkoutRequestId: { type: String, default: '', index: true }, // M-Pesa STK request
    reference: { type: String, default: '', index: true }, // Paystack reference
    receipt: { type: String, default: '' }, // M-Pesa receipt / card transaction id
    amountPaid: { type: Number, default: 0 },
    lastMessage: { type: String, default: '' },
    attempts: { type: Number, default: 0 },
    lastCheckedAt: { type: Date, default: null },
    demo: { type: Boolean, default: false },
  },
  { _id: false },
);

const historySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    by: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, sparse: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    items: { type: [orderItemSchema], required: true },

    shippingAddress: { type: shippingAddressSchema, required: true },

    billingAddress: { type: billingSchema, default: () => ({ sameAsShipping: true }) },

    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },

    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' },

    payment: { type: paymentSchema, default: () => ({}) },

    paidAt: { type: Date, default: null },

    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'PENDING', index: true },

    statusHistory: { type: [historySchema], default: [] },

    deliveryZone: { type: String, default: '' },

    deliveryDays: { type: String, default: '' },

    courier: { type: String, default: '' },

    trackingNumber: { type: String, default: '' },

    customerNote: { type: String, default: '' },

    subtotal: { type: Number, required: true, min: 0 },

    // Savings from sale prices (compareAtPrice − price), shown on the summary.
    discountTotal: { type: Number, default: 0 },

    deliveryFee: { type: Number, required: true, min: 0, default: 0 },

    total: { type: Number, required: true, min: 0 },

    // True once stock taken by this order has been put back (after cancelling).
    stockRestored: { type: Boolean, default: false },

    cancelReason: { type: String, default: '' },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

// SUD-261111-4F7K style numbers: Nairobi date + 4 random characters.
orderSchema.statics.newOrderNumber = async function newOrderNumber() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const date = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(2, 10).replace(/-/g, '');
  for (let i = 0; i < 10; i++) {
    let code = '';
    for (let j = 0; j < 4; j++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    const number = `SUD-${date}-${code}`;
    if (!(await this.exists({ orderNumber: number }))) return number;
  }
  return `SUD-${date}-${Date.now().toString(36).toUpperCase()}`;
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
