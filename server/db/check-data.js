const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkData() {
  try {
    // Get all products
    const { rows } = await client.execute('SELECT * FROM products');
    
    console.log('\nCurrent Products in Database:');
    console.log('----------------------------');
    rows.forEach(product => {
      console.log(`ID: ${product.id}`);
      console.log(`Title: ${product.title}`);
      console.log(`Price: $${product.price}`);
      console.log(`Inventory: ${product.inventory_count}`);
      console.log('----------------------------');
    });

  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData(); 