const { createClient } = require('@libsql/client');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Email sending function
async function sendOrderConfirmation(orderDetails, shipping) {
  const { email, name, orderId, items, total } = orderDetails;
  
  const itemsList = items.map(item => 
    `${item.quantity}x ${item.title} - $${(item.price * item.quantity / 100).toFixed(2)}`
  ).join('\n');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Order Confirmation #${orderId}`,
    text: `
      Hi ${name},

      Thank you for your order! Here are your order details:

      Order #: ${orderId}
      
      Items:
      ${itemsList}

      Total: $${(total / 100).toFixed(2)}

      We'll notify you when your order ships.

      Best regards,
      Sleeve Team
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    const { amount, items, shipping } = req.body;
    
    try {
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
          console.log('Processing item:', item);
          const { rows: [product] } = await client.execute(
            `SELECT price, title FROM products WHERE id = ${item.id}`
          );

          console.log('Found product:', product);

          if (product) {
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
        }

        // Send email after everything else is done
        try {
          console.log('Attempting to send email to:', shipping.email);
          console.log('Email details:', {
            from: process.env.EMAIL_USER,
            to: shipping.email,
            orderId: order.id,
            itemCount: orderItems.length,
            total: amount
          });
          await sendOrderConfirmation({
            email: shipping.email,
            name: shipping.name,
            orderId: order.id,
            items: orderItems,
            total: amount
          }, shipping);
          console.log('Email sent successfully');
        } catch (emailError) {
          console.error('Email error details:', {
            error: emailError.message,
            stack: emailError.stack,
            code: emailError.code,
            command: emailError.command,
            emailConfig: {
              user: process.env.EMAIL_USER ? 'Set' : 'Not set',
              pass: process.env.EMAIL_PASSWORD ? 'Set' : 'Not set'
            }
          });
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