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
        // Create order
        console.log('Creating order with data:', {
          amount,
          shipping,
          paymentIntentId: paymentIntent.id
        });

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

        console.log('Order created:', order);

        if (!order || !order.id) {
          console.error('Failed to create order');
          return;
        }

        // Process order items
        const orderItems = [];
        for (const item of items) {
          console.log(`Processing item ${item.id}...`);
          
          try {
            // First test if we can query anything
            console.log('Testing database connection...');
            await client.execute('SELECT 1');
            console.log('Database connection successful');

            // Try simple product query
            console.log('About to execute product query...');
            const { rows } = await client.execute(
              'SELECT * FROM products WHERE id = ?',
              [item.id]
            );
            console.log('Query executed, rows:', rows);

            if (!rows || rows.length === 0) {
              throw new Error(`No product found with id ${item.id}`);
            }

            const [product] = rows;
            console.log('Product found:', product);

            if (!product) {
              throw new Error(`Product ${item.id} not found`);
            }
            if (typeof product.price === 'undefined') {
              throw new Error(`Product ${item.id} has no price`);
            }

            console.log('Processing item with full details:', {
              item,
              orderId: order.id,
              product
            });

            console.log('Product found, preparing order item...');
            orderItems.push({
              quantity: item.quantity,
              price: product.price,
              title: product.title
            });

            console.log('Inserting order item with values:', {
              orderId: order.id,
              productId: item.id,
              quantity: item.quantity,
              price: product.price
            });

            const insertQuery = `
              INSERT INTO order_items 
                (order_id, product_id, quantity, price_at_time) 
                VALUES (
                  ${Number(order.id)},
                  ${Number(item.id)},
                  ${Number(item.quantity)},
                  ${Number(product.price)}
                )
            `;
            
            console.log('Executing order item insert query:', insertQuery);
            try {
              console.log('Attempting to execute insert...');
              await client.execute(insertQuery);
              console.log('Insert executed successfully');

              // Immediately verify the insert
              const verifyQuery = `
                SELECT * FROM order_items 
                WHERE order_id = ${Number(order.id)} 
                AND product_id = ${Number(item.id)}
              `;
              console.log('Verifying insert with query:', verifyQuery);
              const { rows: [insertedItem] } = await client.execute(verifyQuery);
              console.log('Verification query result:', insertedItem);

              if (!insertedItem) {
                throw new Error('Insert verification failed');
              }

              console.log('Order item inserted and verified:', insertedItem);
            } catch (insertError) {
              console.error('Error during insert or verify:', insertError);
              throw insertError;
            }

            await client.execute(`
              UPDATE products 
              SET inventory_count = inventory_count - ${Number(item.quantity)}
              WHERE id = ${Number(item.id)}
            `);
          } catch (productError) {
            console.error('Product error:', productError);
            throw productError;
          }
        }
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