import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

export default async function handler(req, res) {
  try {
    // Get all table names
    const { rows: tables } = await client.execute(`
      SELECT name FROM sqlite_schema 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%'
    `);
    
    // Get data from each table
    const database = {};
    for (const table of tables) {
      const { rows: data } = await client.execute(`SELECT * FROM ${table.name}`);
      database[table.name] = data;
    }

    res.json({
      tables: tables.map(t => t.name),
      data: database
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
} 