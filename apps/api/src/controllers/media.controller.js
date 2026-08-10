const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const path = require('path');

const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov'];

function inferType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXT.includes(ext)) return 'IMAGE';
  if (VIDEO_EXT.includes(ext)) return 'VIDEO';
  throw new ApiError(400, `Unsupported file type: ${ext}`);
}

// GET /api/media?section=hero  (public — used by the website to render each section)
const listMedia = asyncHandler(async (req, res) => {
  const { section, roomTypeId } = req.query;
  const media = await prisma.media.findMany({
    where: {
      isActive: true,
      ...(section ? { section } : {}),
      ...(roomTypeId ? { roomTypeId } : {}),
    },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ media });
});

// POST /api/admin/media/upload  (admin) — multipart/form-data, field name "file"
// Body fields: section (required), altText, roomTypeId, sortOrder
const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded (expected field "file")');
  const { section, altText, roomTypeId, sortOrder } = req.body;
  if (!section) throw new ApiError(400, 'section is required, e.g. "hero", "gallery", "amenity_pool"');

  const media = await prisma.media.create({
    data: {
      type: inferType(req.file.originalname),
      url: `/uploads/${req.file.filename}`,
      altText: altText || null,
      section,
      roomTypeId: roomTypeId || null,
      sortOrder: sortOrder ? Number(sortOrder) : 0,
    },
  });
  res.status(201).json({ media });
});

// PATCH /api/admin/media/:id  (admin) — reorder, retitle, activate/deactivate, move section
const updateMedia = asyncHandler(async (req, res) => {
  const { altText, sortOrder, section, isActive, roomTypeId } = req.body;
  const media = await prisma.media.update({
    where: { id: req.params.id },
    data: {
      ...(altText !== undefined ? { altText } : {}),
      ...(sortOrder !== undefined ? { sortOrder: Number(sortOrder) } : {}),
      ...(section !== undefined ? { section } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(roomTypeId !== undefined ? { roomTypeId } : {}),
    },
  });
  res.json({ media });
});

// DELETE /api/admin/media/:id  (admin) — soft delete (isActive=false) keeps file on disk;
// pass ?hard=true to also remove the DB row (file cleanup left to a storage lifecycle job).
const deleteMedia = asyncHandler(async (req, res) => {
  if (req.query.hard === 'true') {
    await prisma.media.delete({ where: { id: req.params.id } });
  } else {
    await prisma.media.update({ where: { id: req.params.id }, data: { isActive: false } });
  }
  res.status(204).send();
});

module.exports = { listMedia, uploadMedia, updateMedia, deleteMedia };
