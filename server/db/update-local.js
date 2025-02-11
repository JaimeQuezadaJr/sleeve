const sqlite3 = require('better-sqlite3');
const path = require('path');

const db = new sqlite3(path.join(__dirname, 'store.db'));

function updateLocalDb() {
  try {
    // First, clear existing products
    db.prepare('DELETE FROM products').run();

    // Insert the same products as in Turso
    const stmt = db.prepare(`
      INSERT INTO products (id, title, price, inventory_count)
      VALUES (?, ?, ?, ?)
    `);

    const products = [
      [1, 'Macbook Pro Sleeve 13"', 50, 10],
      [2, 'iPad Pro Sleeve 11"', 30, 10],
      [3, 'Macbook Air Sleeve 13"', 50, 10],
      [4, 'iPad Mini Sleeve', 25, 10]
    ];

    // Insert each product
    products.forEach(product => {
      stmt.run(product);
    });

    console.log('Local database updated successfully');

    // Verify the data
    const updatedProducts = db.prepare('SELECT * FROM products').all();
    console.log('\nCurrent Products in Local Database:');
    console.log('----------------------------');
    updatedProducts.forEach(product => {
      console.log(`ID: ${product.id}`);
      console.log(`Title: ${product.title}`);
      console.log(`Price: $${product.price}`);
      console.log(`Inventory: ${product.inventory_count}`);
      console.log('----------------------------');
    });

  } catch (error) {
    console.error('Error updating local database:', error);
  }
}

updateLocalDb(); 