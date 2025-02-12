const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function fixSchema() {
  try {
    console.log('Starting schema fix...');

    // Drop the incorrect columns from orders table
    await client.execute(`
      CREATE TABLE orders_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT,
        total_amount INTEGER,
        shipping_address TEXT,
        payment_intent_id TEXT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Copy data to temporary table
    await client.execute(`
      INSERT INTO orders_temp (id, status, total_amount, shipping_address, payment_intent_id, user_id, created_at)
      SELECT id, status, total_amount, shipping_address, payment_intent_id, user_id, created_at
      FROM orders
    `);

    // Drop original table
    await client.execute('DROP TABLE orders');

    // Rename temp table to orders
    await client.execute('ALTER TABLE orders_temp RENAME TO orders');

    console.log('Orders table schema fixed');

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
    console.error('Error fixing schema:', error);
  }
}

fixSchema(); 