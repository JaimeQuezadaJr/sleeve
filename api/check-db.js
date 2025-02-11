import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

export default async function handler(req, res) {
  try {
    // First check if we can connect to the database
    console.log('Attempting database connection...');

    // Get table schema
    const { rows: schema } = await client.execute(`
      SELECT sql FROM sqlite_schema 
      WHERE type='table' AND name='products'
    `);

    // Get all products
    const { rows: products } = await client.execute('SELECT * FROM products');

    // Get count of products
    const { rows: count } = await client.execute('SELECT COUNT(*) as count FROM products');

    res.json({
      schema: schema[0]?.sql,
      productCount: count[0]?.count,
      products,
      connection: {
        url: process.env.TURSO_DATABASE_URL ? 'Set' : 'Missing',
        auth: process.env.TURSO_AUTH_TOKEN ? 'Set' : 'Missing'
      }
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: err.message });
  }
} 