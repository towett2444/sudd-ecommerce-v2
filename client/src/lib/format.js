export const ksh = (value) => `KSh ${Math.round(Number(value) || 0).toLocaleString('en-KE')}`;

export const dateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

export const dateOnly = (value) =>
  value ? new Date(value).toLocaleDateString('en-KE', { dateStyle: 'medium' }) : '—';

export const ORDER_STATUS = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700' },
  PROCESSING: { label: 'Processing', className: 'bg-blue-50 text-blue-700' },
  SHIPPED: { label: 'Shipped', className: 'bg-indigo-50 text-indigo-700' },
  DELIVERED: { label: 'Delivered', className: 'bg-green-50 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
};

export const PAYMENT_STATUS = {
  PENDING: { label: 'Unpaid', className: 'bg-amber-50 text-amber-700' },
  PAID: { label: 'Paid', className: 'bg-green-50 text-green-700' },
  FAILED: { label: 'Payment failed', className: 'bg-red-50 text-red-700' },
  REFUNDED: { label: 'Refunded', className: 'bg-gray-100 text-gray-600' },
};

export const PAYMENT_METHOD = { MPESA: 'M-Pesa', CARD: 'Card', COD: 'Cash on delivery' };

export const errorMessage = (error, fallback = 'Something went wrong.') =>
  error?.response?.data?.message || fallback;
