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

    // Get all orders with their items
    const { rows: orders } = await client.execute(`
      SELECT 
        o.*,
        oi.product_id,
        oi.quantity,
        oi.price_at_time
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ORDER BY o.created_at DESC
    `);

    // Get all order items separately
    const { rows: orderItems } = await client.execute(`
      SELECT 
        oi.*,
        p.title as product_title,
        p.price as current_price
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      ORDER BY oi.order_id DESC
    `);

    // Get count of products
    const { rows: count } = await client.execute('SELECT COUNT(*) as count FROM products');

    res.json({
      schema: schema[0]?.sql,
      productCount: count[0]?.count,
      products,
      orders,
      orderItems,
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