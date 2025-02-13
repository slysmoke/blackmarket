const db = require('../config/database');

class Order {
  static async create(orderData) {
    return new Promise((resolve, reject) => {
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);

      db.run(
        'INSERT INTO orders (user_id, item_id, item_name, price, quantity, order_type, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          orderData.user_id,
          orderData.item_id,
          orderData.item_name,
          orderData.price,
          orderData.quantity,
          orderData.order_type,
          expiresAt.toISOString()
        ],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, ...orderData, expires_at: expiresAt });
        }
      );
    });
  }

  static async findAll() {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.all(
        `SELECT orders.*, users.character_name as seller_name,
         ROUND((julianday(expires_at) - julianday(?)) * 24 * 60 * 60) as seconds_remaining
         FROM orders 
         JOIN users ON orders.user_id = users.id 
         WHERE expires_at > ?
         ORDER BY created_at DESC`,
        [now, now],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  static async findByOrderType(orderType) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.all(
        `SELECT orders.*, users.character_name as seller_name,
         ROUND((julianday(expires_at) - julianday(?)) * 24 * 60 * 60) as seconds_remaining
         FROM orders 
         JOIN users ON orders.user_id = users.id 
         WHERE order_type = ? AND expires_at > ?
         ORDER BY created_at DESC`,
        [now, orderType, now],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.all(
        `SELECT *, ROUND((julianday(expires_at) - julianday(?)) * 24 * 60 * 60) as seconds_remaining
         FROM orders 
         WHERE user_id = ? AND expires_at > ?
         ORDER BY created_at DESC`,
        [now, userId, now],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  static async findUserOrdersByType(userId, orderType) {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.all(
        `SELECT *, ROUND((julianday(expires_at) - julianday(?)) * 24 * 60 * 60) as seconds_remaining
         FROM orders 
         WHERE user_id = ? AND order_type = ? AND expires_at > ?
         ORDER BY created_at DESC`,
        [now, userId, orderType, now],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }
}

module.exports = Order;
