const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

/**
 * Protects admin-only routes. Expects `Authorization: Bearer <token>`.
 * For a real deployment, swap this for your identity provider —
 * this is a minimal, self-contained implementation so the API
 * is usable out of the box.
 */
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, 'Missing admin authorization token'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired admin token'));
  }
}

module.exports = { requireAdmin };
