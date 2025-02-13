const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../../blackmarket.db'));

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    character_name TEXT,
    access_token TEXT,
    refresh_token TEXT
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    item_id INTEGER,
    item_name TEXT,
    price DECIMAL(20,2),
    quantity INTEGER,
    order_type TEXT CHECK(order_type IN ('buy', 'sell')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Drop existing market tables to update schema
  // db.run(`DROP TABLE IF EXISTS market_group_types`);
  // db.run(`DROP TABLE IF EXISTS market_items`);
  // db.run(`DROP TABLE IF EXISTS market_groups`);
  // db.run(`DROP TABLE IF EXISTS esi_cache`);

  // Recreate market tables with updated schema
  db.run(`CREATE TABLE IF NOT EXISTS market_groups (
    group_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_group_id INTEGER,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(parent_group_id) REFERENCES market_groups(group_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS market_items (
    type_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    market_group_id INTEGER NULL,
    published BOOLEAN NOT NULL DEFAULT 0,
    volume DECIMAL(20,2),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(market_group_id) REFERENCES market_groups(group_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS market_group_types (
    group_id INTEGER,
    type_id INTEGER,
    PRIMARY KEY (group_id, type_id),
    FOREIGN KEY(group_id) REFERENCES market_groups(group_id),
    FOREIGN KEY(type_id) REFERENCES market_items(type_id)
  )`);

  // Create ESI cache table
  db.run(`CREATE TABLE IF NOT EXISTS esi_cache (
    url TEXT PRIMARY KEY,
    etag TEXT NOT NULL,
    data TEXT NOT NULL,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
