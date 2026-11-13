// Small helpers shared by the newer controllers.

// An error whose message is safe to show to the customer, with an HTTP status.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wraps an async route handler so thrown errors reach the error handler in app.js.
export const ah = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export const text = (value, max = 200) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const toInt = (value, fallback = 0) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Page / limit from the query string, clamped to sensible bounds.
export const paging = (query, defaultLimit = 20, maxLimit = 100) => {
  const limit = Math.min(Math.max(toInt(query.limit, defaultLimit), 1), maxLimit);
  const page = Math.max(toInt(query.page, 1), 1);
  return { page, limit, skip: (page - 1) * limit };
};

// Kenyan phone numbers in any common format -> 2547XXXXXXXX / 2541XXXXXXXX, or null.
export const normalizeKenyanPhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  let n = digits;
  if (n.startsWith('0') && n.length === 10) n = `254${n.slice(1)}`;
  else if ((n.startsWith('7') || n.startsWith('1')) && n.length === 9) n = `254${n}`;
  return /^254[71]\d{8}$/.test(n) ? n : null;
};
