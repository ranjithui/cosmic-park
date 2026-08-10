const { PrismaClient } = require('@prisma/client');

// Reuse a single Prisma client across the app (and across
// nodemon hot-reloads in dev) to avoid exhausting DB connections.
const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

module.exports = prisma;
