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
    
    // Log the incoming items data
    console.log('Incoming items from checkout:', items);
    console.log('Item details:');
    items.forEach(item => {
      console.log({
        id: item.id,
        quantity: item.quantity,
        title: item?.title,
        price: item?.price
      });
    });

    try {
      // Test database connection first
      try {
        await client.execute('SELECT 1');
      } catch (connError) {
        console.error('Database connection failed:', connError);
        throw new Error('Database connection failed');
      }

      // Log request data for debugging
      console.log('Request data:', { amount, items, shipping });

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

      // Create payment intent first
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          shipping: JSON.stringify(shipping),
          items: JSON.stringify(items)
        }
      });

      // Handle order creation and email after responding
      try {
        console.log('Beginning order creation process...');
        
        // Create order
        console.log('Creating order with data:', {
          amount,
          shipping,
          paymentIntentId: paymentIntent.id
        });

        const orderQuery = `
          INSERT INTO orders 
            (status, total_amount, shipping_address, payment_intent_id, user_id) 
            VALUES (
              'completed', 
              ${amount}, 
              '${JSON.stringify(shipping)}', 
              '${paymentIntent.id}',
              ${shipping.userId || 'NULL'}
            ) RETURNING id
        `;
        
        const { rows: [order] } = await client.execute(orderQuery);
        console.log('Order created with ID:', order.id);

        // Process all items in sequence
        for (const item of items) {
          console.log(`Processing item ${item.id} for order ${order.id}...`);
          
          const { rows: [product] } = await client.execute(
            `SELECT * FROM products WHERE id = ${Number(item.id)}`
          );

          if (!product) {
            throw new Error(`Product ${item.id} not found`);
          }

          await client.execute(`
            INSERT INTO order_items 
              (order_id, product_id, quantity, price_at_time)
              VALUES (
                ${Number(order.id)},
                ${Number(item.id)},
                ${Number(item.quantity)},
                ${Number(product.price)}
              )
          `);

          await client.execute(`
            UPDATE products 
            SET inventory_count = inventory_count - ${Number(item.quantity)}
            WHERE id = ${Number(item.id)}
          `);
          
          console.log(`Completed processing item ${item.id}`);
        }

        // Send response only after all database operations are complete
        res.json({ 
          clientSecret: paymentIntent.client_secret,
          orderId: order.id
        });

      } catch (error) {
        console.error('Error during order processing:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
      }
    } catch (err) {
      console.error('Payment intent error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  }
} 