const Order = require('../models/Order');

class OrderController {
  static async createOrder(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const orderData = {
        user_id: req.user.id,
        item_id: req.body.item_id || 0,
        item_name: req.body.item_name,
        price: req.body.price,
        quantity: req.body.quantity,
        order_type: req.body.order_type
      };

      // Validate order type
      if (!['buy', 'sell'].includes(orderData.order_type)) {
        return res.status(400).json({ error: 'Invalid order type. Must be either "buy" or "sell"' });
      }

      const order = await Order.create(orderData);
      res.json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  }

  static async getAllOrders(req, res) {
    try {
      const buyOrders = await Order.findByOrderType('buy');
      const sellOrders = await Order.findByOrderType('sell');
      res.json({ buyOrders, sellOrders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  static async getUserOrders(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const buyOrders = await Order.findUserOrdersByType(req.user.id, 'buy');
      const sellOrders = await Order.findUserOrdersByType(req.user.id, 'sell');
      res.json({ buyOrders, sellOrders });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      res.status(500).json({ error: 'Failed to fetch user orders' });
    }
  }
}

module.exports = OrderController;
