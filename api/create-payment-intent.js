import { createClient } from '@libsql/client';
import Stripe from 'stripe';
import { sendOrderConfirmation } from '../../server/services/emailService';

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
        console.log('Starting database operations...');
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
        console.log('Order insert completed:', order);

        if (!order || !order.id) {
          throw new Error('Failed to get new order ID');
        }

        // Create order items
        for (const item of items) {
          console.log('Processing item for order:', item);
          // Get product price
          const { rows: [product] } = await client.execute(
            `SELECT price FROM products WHERE id = ${item.id}`
          );
          console.log('Found product:', product);

          if (!product) {
            throw new Error(`Product not found: ${item.id}`);
          }

          console.log('Inserting order item...');
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

          console.log('Created order item:', {
            orderId: order.id,
            productId: item.id,
            quantity: item.quantity,
            price: product.price
          });

          // Update inventory count
          await client.execute(
            `UPDATE products 
            SET inventory_count = inventory_count - ${item.quantity} 
            WHERE id = ${item.id}`
          );
        }

        console.log('Order created:', { 
          orderId: order.id,
          amount,
          items: items.length,
          userId: shipping.userId || 'guest',
          shipping: shipping.email
        });

        // Send order confirmation email
        try {
          await sendOrderConfirmation({
            email: shipping.email,
            name: shipping.name,
            orderId: order.id,
            items: items.map(item => ({
              ...item,
              price: product.price,
              title: product.title
            })),
            total: amount
          });
          console.log('Order confirmation email sent');
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          // Don't throw error since order was successful
        }
      } catch (dbError) {
        console.error('Database error:', {
          message: dbError.message,
          stack: dbError.stack,
          error: dbError
        });
        throw dbError; // Let's see the error in the response
      }

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error('Server error:', err);
      res.status(500).json({ error: err.message });
    }
  }
} 