const nodemailer = require('nodemailer');

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Use an app-specific password
  }
});

async function sendOrderConfirmation(orderDetails) {
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
      Sleeve Nine Team
    `
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  transporter,
  sendOrderConfirmation
}; 