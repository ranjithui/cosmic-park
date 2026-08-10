const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/admin/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'email and password are required');

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) throw new ApiError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, role: admin.role, name: admin.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
});

module.exports = { login };
