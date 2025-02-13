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

      // Send the client secret immediately
      res.json({ clientSecret: paymentIntent.client_secret });

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
        console.log('Executing order query:', orderQuery);

        const { rows: [order] } = await client.execute(
          orderQuery
        );

        if (!order) {
          console.error('Order query returned no rows');
          throw new Error('Failed to create order - no rows returned');
        }

        console.log('Order created:', order);
        console.log('Order ID:', order.id);

        if (!order || !order.id) {
          console.error('Failed to create order');
          return;
        }

        console.log('Starting to process order items...');
        for (const item of items) {
          console.log(`Processing item ${item.id}...`);
          
          try {
            console.log('About to execute product query...');
            const productId = Number(item.id);
            console.log('Looking for product with ID:', productId);

            const productQuery = `SELECT * FROM products WHERE id = ${productId}`;
            console.log('Product query:', productQuery);
            
            const { rows } = await client.execute(productQuery);
            console.log('Query executed, rows:', rows);

            if (!rows || rows.length === 0) {
              throw new Error(`No product found with ID ${productId}`);
            }

            const [product] = rows;
            console.log('Raw product data:', product);

            if (!product) {
              throw new Error(`Product ${item.id} not found`);
            }
            if (typeof product.price === 'undefined') {
              throw new Error(`Product ${item.id} has no price`);
            }

            console.log('Product found, preparing order item...');

            console.log('Inserting order item with values:', {
              orderId: order.id,
              productId: item.id,
              quantity: item.quantity,
              price: product.price
            });

            try {
              await client.execute(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_time) 
                 VALUES (?, ?, ?, ?)`,
                [order.id, item.id, item.quantity, product.price]
              );
              console.log('Order item inserted successfully');
            } catch (insertError) {
              console.error('Failed to insert order item:', insertError);
              throw insertError;
            }

            await client.execute(`
              UPDATE products 
              SET inventory_count = inventory_count - ${Number(item.quantity)}
              WHERE id = ${Number(item.id)}
            `);
            console.log('Product inventory updated');
          } catch (error) {
            console.error('Error processing item:', error);
            // Continue with other items even if one fails
            continue;
          }
        }
        console.log('Finished processing all order items');
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    } catch (err) {
      console.error('Payment intent error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    }
  }
} 