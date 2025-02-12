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
async function sendOrderConfirmation(orderDetails) {
  const { email, name, orderId, items, total } = orderDetails;
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px;">${item.title}</td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">$${(item.price / 100).toFixed(2)}</td>
      <td style="padding: 10px; text-align: right;">$${(item.price * item.quantity / 100).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'SLEEVE - Order Confirmation',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #fff; background: #1a1a1a; padding: 20px;">
        <h1 style="color: #fff; font-size: 24px; margin-bottom: 20px;">Order Confirmation</h1>
        <p style="margin-bottom: 20px;">Thank you for your order, ${name}!</p>
        
        <p style="margin-bottom: 10px;">Order ID: ${orderId}</p>
        
        <h2 style="color: #fff; font-size: 18px; margin: 20px 0;">Order Details:</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 1px solid #333;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Quantity</th>
              <th style="padding: 10px; text-align: right;">Price</th>
              <th style="padding: 10px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr style="border-top: 1px solid #333;">
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>$${(total / 100).toFixed(2)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 30px;">
          <h3 style="color: #fff; font-size: 16px; margin-bottom: 10px;">Shipping Address:</h3>
          <p style="margin: 0;">${name}</p>
          <p style="margin: 0;">${shipping.address}</p>
          <p style="margin: 0;">${shipping.city}, ${shipping.state} ${shipping.zipCode}</p>
          <p style="margin: 0;">${shipping.country}</p>
        </div>
        
        <p style="margin-top: 30px; color: #999; font-size: 14px;">
          If you have any questions about your order, please contact our support team at 
          <a href="mailto:sleeve.support@gmail.com" style="color: #fff;">sleeve.support@gmail.com</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; text-align: center; color: #999; font-size: 12px;">
          © 2024 SLEEVE. All rights reserved.
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

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

        // Send order confirmation email
        try {
          await sendOrderConfirmation({
            email: shipping.email,
            name: shipping.name,
            orderId: order.id,
            items: orderItems,
            total: amount
          });
        } catch (emailError) {
          // Don't throw email errors - order was still successful
          console.error('Failed to send confirmation email:', emailError);
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