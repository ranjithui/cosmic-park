const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/admin/rate-plans?roomTypeId=...
const listRatePlans = asyncHandler(async (req, res) => {
  const { roomTypeId } = req.query;
  const ratePlans = await prisma.ratePlan.findMany({
    where: roomTypeId ? { roomTypeId } : undefined,
    orderBy: { startDate: 'asc' },
  });
  res.json({ ratePlans });
});

// POST /api/admin/rate-plans
const createRatePlan = asyncHandler(async (req, res) => {
  const { roomTypeId, name, startDate, endDate, nightlyRate, minStay, priority } = req.body;

  if (new Date(startDate) >= new Date(endDate)) {
    throw new ApiError(400, 'endDate must be after startDate');
  }

  const ratePlan = await prisma.ratePlan.create({
    data: {
      roomTypeId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      nightlyRate,
      minStay: minStay ?? 1,
      priority: priority ?? 0,
    },
  });
  res.status(201).json({ ratePlan });
});

// PATCH /api/admin/rate-plans/:id
const updateRatePlan = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (data.startDate) data.startDate = new Date(data.startDate);
  if (data.endDate) data.endDate = new Date(data.endDate);

  const ratePlan = await prisma.ratePlan.update({ where: { id: req.params.id }, data });
  res.json({ ratePlan });
});

// DELETE /api/admin/rate-plans/:id
const deleteRatePlan = asyncHandler(async (req, res) => {
  await prisma.ratePlan.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { listRatePlans, createRatePlan, updateRatePlan, deleteRatePlan };
