require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db/init');
const { sendOrderConfirmation } = require('./services/emailService');
const { createOrderConfirmationEmail } = require('./utils/emailTemplate');

const app = express();

// Update CORS configuration to be more permissive
app.use(cors({
  origin: ['your_frontend_url'],
  credentials: true
}));

// Use raw body for webhook route
app.use('/webhook', express.raw({ type: 'application/json' }));
// Use JSON parsing for all other routes
app.use(express.json());

// Get products with inventory
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products WHERE inventory_count > 0').all();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create payment intent and order
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, items, shipping } = req.body;
  console.log('Received payment intent request:', { amount, items, shipping });
  
  try {
    // First, verify inventory without modifying the database
    for (const item of items) {
      const product = db.prepare('SELECT inventory_count FROM products WHERE id = ?').get(item.id);
      
      if (!product || product.inventory_count < item.quantity) {
        throw new Error(`Insufficient inventory for product ${item.id}`);
      }
    }
    
    // Simplify the items data for metadata
    const simplifiedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      image: item.image
    }));
    
    // Create Stripe payment intent first
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        shipping: JSON.stringify({
          email: shipping.email,
          name: shipping.name,
          address: shipping.address,
          city: shipping.city,
          state: shipping.state,
          zipCode: shipping.zipCode,
          country: shipping.country
        }),
        items: JSON.stringify(simplifiedItems)
      }
    });
    console.log('Created payment intent with metadata:', paymentIntent.metadata);
    
    // Send the client secret back immediately
    res.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
});

// Webhook to handle successful payments
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook event received:', event.type);

  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('Processing successful payment:', paymentIntent.id);
    
    try {
      const shipping = JSON.parse(paymentIntent.metadata.shipping);
      const items = JSON.parse(paymentIntent.metadata.items);
      console.log('Parsed metadata:', { shipping, items });
      
      // Now perform the database transaction after payment success
      const transaction = db.transaction(() => {
        console.log('Starting database transaction...');
        
        // Create or get user
        const user = db.prepare(`
          INSERT INTO users (email, name) 
          VALUES (?, ?)
          ON CONFLICT(email) DO UPDATE SET name = excluded.name
          RETURNING id
        `).get(shipping.email, shipping.name);
        console.log('User created/updated:', user);
        
        // Create order
        const order = db.prepare(`
          INSERT INTO orders (user_id, status, total_amount, shipping_address, payment_intent_id)
          VALUES (?, ?, ?, ?, ?)
          RETURNING id
        `).get(user.id, 'paid', paymentIntent.amount, JSON.stringify(shipping), paymentIntent.id);
        console.log('Order created:', order);
        
        // Create order items and update inventory
        const insertItem = db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
          VALUES (?, ?, ?, ?)
        `);
        
        const updateInventory = db.prepare(`
          UPDATE products 
          SET inventory_count = inventory_count - ?
          WHERE id = ?
        `);
        
        for (const item of items) {
          console.log('Processing item:', item);
          insertItem.run(order.id, item.id, item.quantity, item.price);
          updateInventory.run(item.quantity, item.id);
        }
        
        return order.id;
      });
      
      const orderId = transaction();
      console.log('Order successfully created:', orderId);
      
      // Send confirmation email
      try {
        const orderDetails = createOrderConfirmationEmail(
          { id: orderId },
          items,
          shipping
        );
        await sendOrderConfirmation(shipping.email, orderDetails);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw the error as the order was still successful
      }
      
    } catch (err) {
      console.error('Error processing successful payment:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        paymentIntent: paymentIntent.id,
        metadata: paymentIntent.metadata
      });
    }
  }

  res.json({received: true});
});

// Add this new endpoint to get order history
app.get('/api/orders/:userId', (req, res) => {
  try {
    // Get all orders for the user
    const orders = db.prepare(`
      SELECT 
        orders.id as order_id,
        orders.created_at,
        orders.status,
        orders.total_amount,
        orders.shipping_address,
        JSON_GROUP_ARRAY(
          JSON_OBJECT(
            'id', order_items.product_id,
            'quantity', order_items.quantity,
            'price', order_items.price_at_time,
            'title', products.title,
            'image', products.image_url
          )
        ) as items
      FROM orders
      JOIN order_items ON orders.id = order_items.order_id
      JOIN products ON order_items.product_id = products.id
      WHERE orders.user_id = ?
      GROUP BY orders.id
      ORDER BY orders.created_at DESC
    `).all(req.params.userId);

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add endpoint to get a single order
app.get('/api/orders/:userId/:orderId', (req, res) => {
  try {
    const order = db.prepare(`
      SELECT 
        orders.*,
        users.email,
        users.name
      FROM orders
      JOIN users ON orders.user_id = users.id
      WHERE orders.id = ? AND orders.user_id = ?
    `).get(req.params.orderId, req.params.userId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get order items
    const items = db.prepare(`
      SELECT 
        order_items.*,
        products.title,
        products.image_url
      FROM order_items
      JOIN products ON order_items.product_id = products.id
      WHERE order_items.order_id = ?
    `).all(order.id);

    res.json({
      ...order,
      items
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add an admin endpoint to get all orders
app.get('/api/admin/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT 
        orders.id as order_id,
        orders.created_at,
        orders.status,
        orders.total_amount,
        users.email as user_email,
        users.name as user_name,
        COUNT(order_items.id) as item_count,
        SUM(order_items.quantity) as total_items
      FROM orders
      JOIN users ON orders.user_id = users.id
      JOIN order_items ON orders.id = order_items.order_id
      GROUP BY orders.id
      ORDER BY orders.created_at DESC
    `).all();

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change from localhost to 0.0.0.0 to listen on all network interfaces
app.listen(3001, '0.0.0.0', () => {
  console.log('Server is running on port 3001');
}); 