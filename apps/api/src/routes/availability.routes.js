const router = require('express').Router();
const { checkAvailability } = require('../controllers/availability.controller');
const { validate, availabilityQuerySchema } = require('../utils/validators');

// GET /api/availability?checkIn=&checkOut=&guests=
router.get('/', validate(availabilityQuerySchema, 'query'), checkAvailability);

module.exports = router;
