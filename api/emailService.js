const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendOrderConfirmation(orderDetails) {
  const { email, name, orderId, items, total } = orderDetails;

  // Format items for email
  const itemsList = items.map(item => 
    `• ${item.quantity}x ${item.title} - $${(item.price * item.quantity).toFixed(2)}`
  ).join('\n');

  const emailContent = `
    Hello ${name},

    Thank you for your order! 

    Order Details:
    Order #: ${orderId}

    Items:
    ${itemsList}

    Total: $${(total/100).toFixed(2)}

    We'll notify you when your order ships.

    Best regards,
    SLEEVE Team
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `SLEEVE - Order Confirmation #${orderId}`,
      text: emailContent
    });
    
    console.log('Order confirmation email sent to:', email);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

module.exports = {
  transporter,
  sendOrderConfirmation
}; 