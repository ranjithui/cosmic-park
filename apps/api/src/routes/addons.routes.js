const router = require('express').Router();
const ctrl = require('../controllers/addons.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/', ctrl.listAddOns);
router.post('/', requireAdmin, ctrl.createAddOn);
router.patch('/:id', requireAdmin, ctrl.updateAddOn);

module.exports = router;
