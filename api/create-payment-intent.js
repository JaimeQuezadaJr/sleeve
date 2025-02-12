const { createClient } = require('@libsql/client');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    const { amount, items, shipping } = req.body;
    
    try {
      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Invalid items array');
      }

      // Verify inventory
      for (const item of items) {
        if (typeof item.id !== 'number') {
          throw new Error(`Invalid item ID type: ${typeof item.id}`);
        }

        const { rows } = await client.execute(
          `SELECT inventory_count FROM products WHERE id = ${item.id}`
        );
        
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
          `INSERT INTO orders 
            (status, total_amount, shipping_address, payment_intent_id, user_id) 
            VALUES (
              'completed', 
              ${amount}, 
              '${JSON.stringify(shipping)}', 
              '${paymentIntent.id}',
              ${shipping.userId || 'NULL'}
            ) RETURNING id`
        );

        if (!order || !order.id) {
          throw new Error('Failed to get new order ID');
        }

        // Create order items
        const orderItems = [];  // Store items with their details
        for (const item of items) {
          // Get product price
          const { rows: [product] } = await client.execute(
            `SELECT price, title FROM products WHERE id = ${item.id}`
          );

          if (!product) {
            throw new Error(`Product not found: ${item.id}`);
          }

          // Store item details for email
          orderItems.push({
            quantity: item.quantity,
            price: product.price,
            title: product.title
          });

          await client.execute(
            `INSERT INTO order_items 
              (order_id, product_id, quantity, price_at_time) 
              VALUES (
                ${order.id}, 
                ${item.id}, 
                ${item.quantity}, 
                ${product.price}
              )`
          );

          await client.execute(
            `UPDATE products 
            SET inventory_count = inventory_count - ${item.quantity} 
            WHERE id = ${item.id}`
          );
        }

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (dbError) {
        throw dbError;
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
} 