import { createClient } from '@libsql/client';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { amount, items, shipping } = req.body;
    
    try {
      // Add more detailed logging
      console.log('Received request:', { 
        amount, 
        itemsType: typeof items,
        isArray: Array.isArray(items),
        items,
        shipping 
      });

      // Verify inventory
      for (const item of items) {
        console.log('Item structure:', {
          id: item.id,
          type: typeof item.id,
          parsed: parseInt(item.id),
          fullItem: item
        });

        const { rows } = await client.execute(
          'SELECT inventory_count FROM products WHERE id = ?',
          [parseInt(item.id)]
        );
        
        console.log('SQL Query:', {
          query: 'SELECT inventory_count FROM products WHERE id = ?',
          params: [parseInt(item.id)],
          response: rows
        });

        if (!rows[0] || rows[0].inventory_count < item.quantity) {
          throw new Error(`Insufficient inventory for product ${item.id}`);
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          shipping: JSON.stringify(shipping),
          items: JSON.stringify(items)
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json({ error: err.message });
    }
  }
} 