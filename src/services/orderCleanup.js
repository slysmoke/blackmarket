const db = require('../config/database');

class OrderCleanupService {
  static async cleanupExpiredOrders() {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      db.run('DELETE FROM orders WHERE expires_at < ?', [now], function(err) {
        if (err) {
          console.error('Error cleaning up expired orders:', err);
          reject(err);
        } else {
          console.log(`Cleaned up ${this.changes} expired orders`);
          resolve(this.changes);
        }
      });
    });
  }

  static scheduleCleanup(intervalMinutes = 60) {
    // Run cleanup immediately
    this.cleanupExpiredOrders();

    // Schedule periodic cleanup
    setInterval(() => {
      this.cleanupExpiredOrders();
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = OrderCleanupService;
