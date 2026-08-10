/**
 * Custom error class so services can throw with an explicit
 * HTTP status instead of every controller guessing one.
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    error: {
      message: err.message || 'Internal server error',
    },
  };
  if (err.details) payload.error.details = err.details;

  if (statusCode === 500) {
    // Don't leak internals on unexpected errors
    console.error(err);
    payload.error.message = 'Internal server error';
  }

  res.status(statusCode).json(payload);
}

module.exports = { ApiError, notFoundHandler, errorHandler };
