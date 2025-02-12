const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function updateInventory() {
  try {
    // Update all products to have 1000 items
    await client.execute(`
      UPDATE products 
      SET inventory_count = 1000 
      WHERE id IN (1, 2, 3, 4)
    `);

    // Verify the update
    const { rows } = await client.execute('SELECT * FROM products');
    console.log('Updated inventory counts:');
    rows.forEach(product => {
      console.log(`${product.title}: ${product.inventory_count} items`);
    });

  } catch (error) {
    console.error('Error updating inventory:', error);
  }
}

updateInventory(); 