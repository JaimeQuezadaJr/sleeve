const { createClient } = require('@libsql/client');
require('dotenv').config({ path: './server/.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function resetDatabase() {
  try {
    console.log('Starting database reset...');

    // Delete all records from order_items first (due to foreign key constraints)
    await client.execute('DELETE FROM order_items');
    console.log('Cleared order_items table');

    // Delete all records from orders
    await client.execute('DELETE FROM orders');
    console.log('Cleared orders table');

    // Reset products inventory to 1000
    await client.execute(`
      UPDATE products 
      SET inventory_count = 1000 
      WHERE id IN (1, 2, 3, 4)
    `);
    console.log('Reset product inventory to 1000');

    // Verify the reset
    const { rows: products } = await client.execute('SELECT * FROM products');
    console.log('\nCurrent product inventory:');
    products.forEach(product => {
      console.log(`${product.title}: ${product.inventory_count} items`);
    });

  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

resetDatabase(); 