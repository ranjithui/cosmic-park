const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/db');

// GET /api/add-ons  (public — shown at checkout)
const listAddOns = asyncHandler(async (req, res) => {
  const addOns = await prisma.addOnCatalog.findMany({ where: { isActive: true } });
  res.json({ addOns });
});

// POST /api/admin/add-ons  (admin)
const createAddOn = asyncHandler(async (req, res) => {
  const { name, description, unit, price, taxRate } = req.body;
  const addOn = await prisma.addOnCatalog.create({
    data: { name, description, unit, price, taxRate },
  });
  res.status(201).json({ addOn });
});

// PATCH /api/admin/add-ons/:id  (admin)
const updateAddOn = asyncHandler(async (req, res) => {
  const addOn = await prisma.addOnCatalog.update({ where: { id: req.params.id }, data: req.body });
  res.json({ addOn });
});

module.exports = { listAddOns, createAddOn, updateAddOn };
