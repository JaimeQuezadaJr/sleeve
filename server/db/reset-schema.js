const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function resetSchema() {
  try {
    console.log('Starting complete schema reset...');

    // Drop existing tables
    await client.execute('DROP TABLE IF EXISTS order_items');
    await client.execute('DROP TABLE IF EXISTS orders');
    
    // Create orders table with correct schema
    await client.execute(`
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT,
        total_amount INTEGER,
        shipping_address TEXT,
        payment_intent_id TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create order_items table
    await client.execute(`
      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        price_at_time INTEGER,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    console.log('Schema reset complete');

    // Verify the tables
    const { rows: orderColumns } = await client.execute(`
      SELECT * FROM pragma_table_info('orders')
    `);
    console.log('\nOrders table columns:', orderColumns.map(col => col.name));

    const { rows: orderItemsColumns } = await client.execute(`
      SELECT * FROM pragma_table_info('order_items')
    `);
    console.log('\nOrder items table columns:', orderItemsColumns.map(col => col.name));

  } catch (error) {
    console.error('Error resetting schema:', error);
  }
}

resetSchema(); 