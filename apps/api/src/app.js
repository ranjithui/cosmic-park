require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));
app.use('/admin', express.static(path.join(process.cwd(), 'public/admin')));

// Basic rate limiting on the public booking-mutation endpoints —
// prevents someone from hammering hold-creation to lock out rooms.
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many booking requests — please slow down.' } },
});

// --- Route mounting ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/availability', require('./routes/availability.routes'));
app.use('/api/bookings', bookingLimiter, require('./routes/bookings.routes'));
app.use('/api/room-types', require('./routes/rooms.routes'));
app.use('/api/rooms', require('./routes/roomUnits.routes'));
app.use('/api/rate-plans', require('./routes/rates.routes'));
app.use('/api/guests', require('./routes/guests.routes'));
app.use('/api/media', require('./routes/media.routes'));
app.use('/api/add-ons', require('./routes/addons.routes'));
app.use('/api/admin/dashboard', require('./routes/dashboard.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
