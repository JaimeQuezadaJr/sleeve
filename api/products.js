import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await client.execute('SELECT * FROM products WHERE inventory_count > 0');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
} 