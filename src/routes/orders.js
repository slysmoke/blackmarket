const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { ensureAuthenticated } = require('../middleware/auth');

router.post('/', ensureAuthenticated, OrderController.createOrder);
router.get('/', OrderController.getAllOrders);
router.get('/user', ensureAuthenticated, OrderController.getUserOrders);

module.exports = router;
