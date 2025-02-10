const sqlite3 = require('better-sqlite3');
const path = require('path');

const db = new sqlite3(path.join(__dirname, 'store.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    status TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_intent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_time INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    image_url TEXT,
    inventory_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Insert some sample products
  INSERT OR IGNORE INTO products (id, title, description, price, image_url, inventory_count)
  VALUES 
    (1, 'Macbook Pro', 'Engineered with military-grade 1000D nylon exterior...', 80, '/sleeve.webp', 10),
    (2, 'iPad Pro', 'Protected by a high-density 800D nylon shell...', 120, '/UltraSleeve_16_rose.webp', 15),
    (3, 'Macbook Air', 'Constructed with aerospace-grade ballistic nylon...', 100, '/sleeve.webp', 20),
    (4, 'iPad Air', 'Features a ripstop nylon exterior...', 150, '/UltraSleeve_16_rose.webp', 12);
`);

module.exports = db; 