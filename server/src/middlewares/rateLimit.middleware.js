// Simple in-memory rate limiter (per IP + route). Good enough for a single server.
export const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, list] of hits) {
      const recent = list.filter((t) => now - t < windowMs);
      if (recent.length) hits.set(key, recent);
      else hits.delete(key);
    }
  }, windowMs).unref();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ success: false, message });
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
};
