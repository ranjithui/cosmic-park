const router = require('express').Router();
const ctrl = require('../controllers/media.controller');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/media?section=hero  (public — website renders whatever is here)
router.get('/', ctrl.listMedia);

// --- Admin ---
// POST /api/media/upload  (multipart/form-data: file + section + altText + roomTypeId?)
router.post('/upload', requireAdmin, upload.single('file'), ctrl.uploadMedia);
// PATCH /api/media/:id  — reorder / retitle / move section / activate-deactivate
router.patch('/:id', requireAdmin, ctrl.updateMedia);
// DELETE /api/media/:id  (?hard=true to fully remove the row)
router.delete('/:id', requireAdmin, ctrl.deleteMedia);

module.exports = router;
