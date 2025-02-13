const db = require('../config/database');

class User {
  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  static async createOrUpdate(userData) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO users (id, character_name, access_token, refresh_token) VALUES (?, ?, ?, ?)',
        [userData.id, userData.character_name, userData.access_token, userData.refresh_token],
        function(err) {
          if (err) reject(err);
          resolve({ id: userData.id, ...userData });
        }
      );
    });
  }
}

module.exports = User;
