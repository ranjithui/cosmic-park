const router = require('express').Router();
const ctrl = require('../controllers/rates.controller');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin); // every rate-plan route is admin-only

router.get('/', ctrl.listRatePlans);
router.post('/', ctrl.createRatePlan);
router.patch('/:id', ctrl.updateRatePlan);
router.delete('/:id', ctrl.deleteRatePlan);

module.exports = router;
