const router = require('express').Router();
const { login } = require('../controllers/auth.controller');

// POST /api/auth/login
router.post('/login', login);

module.exports = router;
