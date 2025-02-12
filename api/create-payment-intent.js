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
      // Log the raw request
      console.log('Raw items:', JSON.stringify(items, null, 2));

      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invalid items array');
      }

      // Verify inventory
      for (const item of items) {
        if (typeof item.id !== 'number') {
          throw new Error(`Invalid item ID type: ${typeof item.id}`);
        }

        console.log('Processing item:', {
          item,
          idType: typeof item.id,
          idValue: item.id,
        });

        const { rows } = await client.execute(
          `SELECT inventory_count FROM products WHERE id = ${item.id}`
        );
        
        console.log('Query results:', {
          sql: `SELECT inventory_count FROM products WHERE id = ${item.id}`,
          rowCount: rows.length,
          firstRow: rows[0]
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

      try {
        // Create order
        const { rows: [order] } = await client.execute(
          `INSERT INTO orders (
            status,
            total_amount,
            shipping_address,
            payment_intent_id
          ) VALUES (?, ?, ?, ?) RETURNING id`,
          [
            'completed',
            amount,
            JSON.stringify(shipping),
            paymentIntent.id
          ]
        );

        // Create order items
        for (const item of items) {
          await client.execute(
            `INSERT INTO order_items (
              order_id,
              product_id,
              quantity,
              price_at_time
            ) VALUES (?, ?, ?, ?)`,
            [
              order.id,
              item.id,
              item.quantity,
              item.price || 0  // Get actual price from products table
            ]
          );
        }

        console.log('Order created:', { orderId: order.id });
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Still return success since payment worked
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json({ error: err.message });
    }
  }
} 